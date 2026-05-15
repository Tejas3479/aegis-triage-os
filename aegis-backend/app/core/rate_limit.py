import time
from collections import defaultdict
from typing import DefaultDict, List
from fastapi import HTTPException, status

_buckets: DefaultDict[str, List[float]] = defaultdict(list)


def check_rate_limit(key: str, max_requests: int = 20, window_seconds: int = 60) -> None:
    """Simple in-memory rate limiter for auth and public endpoints."""
    now = time.time()
    window_start = now - window_seconds
    _buckets[key] = [ts for ts in _buckets[key] if ts > window_start]
    if len(_buckets[key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    _buckets[key].append(now)
