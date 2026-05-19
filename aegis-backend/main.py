import logging
import json
import re
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings, validate_production_settings
from app.core.database import db_client
from app.core.checkpointer import init_checkpointer, shutdown_checkpointer
from app.domains.triage.graph_engine import init_graph_engine
from app.security.clinical_auth import bootstrap_clinical_users
from app.api.v1 import triage, doctor, public_health, auth, patient, clinical, streaming, admin
from app.core.observability import ObservabilityMiddleware, logger
from app.core.auth import check_role, get_current_user
from app.middleware.audit_proxy import AuditProxyMiddleware
from app.middleware.pii_masking import PIIMaskingMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager managing runtime database client pools.
    """
    validate_production_settings()
    logger.info("Initializing Aegis Enterprise Engine...")
    await db_client.connect()
    # Ping DB to verify connection
    try:
        await asyncio.to_thread(lambda: db_client.client.table("patients").select("id").limit(1).execute())
        logger.info("Database ping successful.")
    except Exception as e:
        logger.critical(f"Database ping failed: {e}")
        logger.warning("Proceeding without database connection (Dev Mode).")
    bootstrap_clinical_users()
    checkpointer = init_checkpointer()
    init_graph_engine(checkpointer)
    yield
    shutdown_checkpointer()
    await db_client.disconnect()
    logger.info("Aegis Enterprise Engine terminated.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-Grade AI Clinical Triage & Epidemic Monitoring OS",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# 1. ENTERPRISE OBSERVABILITY & TRACING
app.add_middleware(ObservabilityMiddleware)

app.add_middleware(PIIMaskingMiddleware)

# 3. MEDICAL DISCLAIMER
class MedicalDisclaimerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Medical-Disclaimer"] = (
            "Aegis OS is an AI assistant, not a replacement for professional medical diagnosis."
        )
        return response

app.add_middleware(MedicalDisclaimerMiddleware)

# 4. CORS CONFIGURATION (STRICT)
if not settings.ALLOWED_ORIGINS:
    logger.critical("CORS CONFIGURATION ERROR: ALLOWED_ORIGINS not found in environment.")
    raise RuntimeError("Security Violation: Application cannot start with unrestricted CORS. Define ALLOWED_ORIGINS.")

origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Medical-Disclaimer", "X-Request-ID", "X-Process-Time-MS"]
)

# 5. AUDIT PROXY MIDDLEWARE
app.add_middleware(AuditProxyMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal enterprise engine error occurred.", "request_id": request.headers.get("X-Request-ID")}
    )

@app.get("/health", tags=["System"])
async def root_health_status():
    import asyncio
    from app.core.database import db_client
    from app.core.rate_limit import _get_redis_client
    from app.core.model_router import llm_router
    from app.core.llm_provider import GeminiProvider
    from app.core.config import settings
    
    status_code = 200
    details = {
        "database": "unknown",
        "redis": "unknown",
        "gemini_api": "unknown"
    }
    
    # 1. Check Database
    try:
        await asyncio.to_thread(lambda: db_client.client.table("patients").select("id").limit(1).execute())
        details["database"] = "operational"
    except Exception as e:
        details["database"] = f"failed: {str(e)}"
        status_code = 503
        
    # 2. Check Redis
    try:
        client = _get_redis_client()
        if client:
            client.ping()
            details["redis"] = "operational"
        else:
            details["redis"] = "not configured"
    except Exception as e:
        details["redis"] = f"failed: {str(e)}"
        status_code = 503
        
    # 3. Check Gemini API
    try:
        gemini_provider = next((p for p in llm_router.providers if isinstance(p, GeminiProvider)), None)
        if gemini_provider:
            await asyncio.to_thread(lambda: gemini_provider.client.models.get(model=settings.GEMINI_MODEL))
            details["gemini_api"] = "operational"
        else:
            details["gemini_api"] = "not configured"
    except Exception as e:
        details["gemini_api"] = f"failed: {str(e)}"
        status_code = 503
        
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "operational" if status_code == 200 else "degraded",
            "version": "2.0.0",
            "details": details
        }
    )

# 5. ENTERPRISE ROUTE MOUNTING (HARDENED)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Security"])

# Public DPDP consent (rate-limited, no JWT)
app.include_router(patient.router, prefix="/api/v1/patient", tags=["Patient Consent & Lifecycle Core"])

# Streaming Audio (WebSocket)
app.include_router(streaming.router, prefix="/api/v1/streaming", tags=["Streaming Audio"])

# Protected Clinical Routes
app.include_router(
    triage.router, 
    prefix="/api/v1/triage", 
    tags=["Clinical Triage Engine"],
    dependencies=[Depends(get_current_user)]
)


# Role-Based Professional Routes
app.include_router(
    doctor.router, 
    prefix="/api/v1/doctor", 
    tags=["Professional Routing"],
    dependencies=[Depends(check_role(["DOCTOR", "ADMIN"]))]
)
app.include_router(
    clinical.router, 
    tags=["Clinical Interoperability (ICE)"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    public_health.router, 
    prefix="/api/v1/public-health", 
    tags=["Epidemic Monitoring"],
    dependencies=[Depends(check_role(["ADMIN"]))]
)

app.include_router(
    admin.router,
    prefix="/api/v1/admin",
    tags=["Admin Configuration"],
    dependencies=[Depends(check_role(["ADMIN"]))]
)
