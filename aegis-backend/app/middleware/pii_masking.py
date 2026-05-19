import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.security.pii_vault import pii_vault

logger = logging.getLogger("aegis_core")

class PIIMaskingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to mask PII in incoming JSON requests for clinical endpoints.
    Uses PrivacyInterceptor (Presidio + Regex Fallback).
    """
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/v1/triage") and request.method == "POST":
            # Check if content-type is JSON
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    body = await request.body()
                    if body:
                        data = json.loads(body)
                        modified = False
                        
                        # Redact common fields that might contain PII
                        if "content" in data and isinstance(data["content"], str):
                            data["content"] = pii_vault.redact_input(data["content"])
                            modified = True
                            
                        if "description" in data and isinstance(data["description"], str):
                            data["description"] = pii_vault.redact_input(data["description"])
                            modified = True
                            
                        if modified:
                            # Replace the receive channel to return the modified body
                            body_bytes = json.dumps(data).encode()
                            
                            async def receive():
                                return {"type": "http.request", "body": body_bytes}
                            
                            request._receive = receive
                            logger.info(f"PII masked in request to {request.url.path}")
                except Exception as e:
                    logger.warning(f"Failed to mask PII in middleware: {e}")
                    
        response = await call_next(request)
        return response
