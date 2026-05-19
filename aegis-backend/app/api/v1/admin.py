import logging
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, User, check_role
from app.core.database import db_client

router = APIRouter()
logger = logging.getLogger("aegis_core")

SETTINGS_KEY = "clinical"

@router.get("/settings")
async def get_settings(current_user: User = Depends(check_role(["ADMIN"]))):
    if not db_client.client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        result = db_client.client.table("system_settings").select("value").eq("key", SETTINGS_KEY).execute()
        if result.data:
            return result.data[0]["value"]
        else:
            # Fallback defaults
            return {"risk_threshold": 70, "auto_fallback": True, "pii_redaction": True, "session_ttl": True}
    except Exception as e:
        logger.error(f"Failed to read settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to read settings")

@router.post("/settings")
async def update_settings(payload: dict, current_user: User = Depends(check_role(["ADMIN"]))):
    if not db_client.client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        # Upsert
        db_client.client.table("system_settings").upsert(
            {"key": SETTINGS_KEY, "value": payload, "updated_at": "now()"},
            on_conflict="key"
        ).execute()
        return {"status": "saved"}
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save settings")
