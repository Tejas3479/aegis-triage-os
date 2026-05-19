import time
import logging
from typing import Optional
from fastapi import HTTPException, status
import redis
from app.core.config import settings

logger = logging.getLogger("aegis_core")
_redis_client: Optional[redis.Redis] = None
_fallback_buckets = {}

def _get_redis_client() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
        
    if not settings.REDIS_URL:
        logger.warning("REDIS_URL not configured. Using in-memory rate limiting fallback.")
        return None
        
    try:
        client = redis.from_url(settings.REDIS_URL)
        # Test connection
        client.ping()
        _redis_client = client
        logger.info("Connected to Redis for rate limiting.")
        return _redis_client
    except Exception as e:
        logger.critical("Failed to connect to Redis for rate limiting (%s). Falling back to in-memory.", e)
        _redis_client = None
        return None


def check_rate_limit(key: str, max_requests: int = 20, window_seconds: int = 60) -> None:
    """
    Distributed rate limiter using Redis.
    Falls back to in-memory if Redis is unavailable.
    """
    client = _get_redis_client()
    
    if client is None:
        # Fallback to in-memory (per-process, not distributed)
        global _fallback_buckets
        now = time.time()
        window_start = now - window_seconds
        
        if key not in _fallback_buckets:
            _fallback_buckets[key] = []
            
        _fallback_buckets[key] = [ts for ts in _fallback_buckets[key] if ts > window_start]
        
        if len(_fallback_buckets[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )
        _fallback_buckets[key].append(now)
        return

    # Redis Sliding Window Implementation
    now = time.time()
    # Unique member to avoid collisions if multiple requests hit at the exact same microsecond
    member = f"{now}-{time.time_ns()}"
    
    try:
        pipe = client.pipeline()
        # Remove timestamps outside the window
        pipe.zremrangebyscore(key, 0, now - window_seconds)
        # Count remaining requests
        pipe.zcard(key)
        # Add current request
        pipe.zadd(key, {member: now})
        # Set expiry for the bucket
        pipe.expire(key, window_seconds)
        
        results = pipe.execute()
        current_count = results[1]
        
        if current_count >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )
    except redis.RedisError as e:
        logger.error("Redis rate limit operation failed: %s. Failing closed.", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiting service unavailable.",
        )
