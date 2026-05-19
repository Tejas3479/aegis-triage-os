import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.security.ledger import ledger
from app.security.pii_vault import pii_vault
import json

logger = logging.getLogger("aegis_core")

class AuditProxyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Synchronous Audit Interceptor.
        Intercepts payloads, strips PII, and logs to the immutable ledger.
        """
        # Intercept POST/PUT requests with JSON bodies
        if request.method in ["POST", "PUT"] and "application/json" in request.headers.get("content-type", ""):
            try:
                # Read the body
                body = await request.body()
                
                # Strip PII for the telemetry log
                body_str = body.decode("utf-8")
                redacted_str = pii_vault.redact_input(body_str)
                
                # Extract session_id from path if present
                session_id = "UNKNOWN"
                parts = request.url.path.split("/")
                for i, part in enumerate(parts):
                    if "session" in part and i + 1 < len(parts):
                        session_id = parts[i+1]
                        break
                
                # Log to ledger (decoupled from main execution flow)
                await ledger.log_event("API_REQUEST_INTERCEPTED", session_id, {"path": request.url.path, "payload": redacted_str})
                
                # Reset the receive channel so the endpoint can read the body
                async def receive():
                    return {"type": "http.request", "body": body}
                
                request._receive = receive
                
            except Exception as e:
                logger.warning(f"Audit proxy failed to intercept: {str(e)}")
                
        response = await call_next(request)
        return response
