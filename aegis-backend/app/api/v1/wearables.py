import hmac
import asyncio
import hashlib
import logging
import json
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from typing import Annotated, Dict, Any
from app.core.config import settings
from app.core.auth import get_current_user, User, assert_session_access
from app.services.graph_engine import get_graph_engine
from app.services.database import db_client
from app.models.schemas import CareLevel

router = APIRouter()
webhook_router = APIRouter()
logger = logging.getLogger("aegis_core")


@webhook_router.post("/webhook")
async def receive_vital_monitoring(
    request: Request,
    x_signature: Annotated[str, Header()] = None
):
    """
    Cryptographically signed webhook receivers for vital monitoring.
    Verifies HMAC-SHA256 signatures for production security.
    Resolved: Double-body-read exception by manual JSON parsing.
    """
    if not x_signature:
        raise HTTPException(status_code=401, detail="Missing cryptographic signature")
    
    # 1. Verification Logic
    body = await request.body()
    expected_signature = hmac.new(
        settings.SECRET_KEY.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_signature):
        logger.warning(f"Invalid webhook signature attempt from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid cryptographic signature")
    
    # 2. Process Vitals
    try:
        payload = json.loads(body)
        logger.info(f"Vitals verified and received for patient: {payload.get('patient_id')}")
        return {"status": "verified_and_processed", "vitals_received": True}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

@router.post("/sync")
async def sync_wearable_data(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """
    Advanced Wearables Integration: Syncs real-time vitals into the active LangGraph state.
    Resolved: Database execution bug (missing parentheses on .execute()).
    """
    session_id = payload.get("session_id")
    heart_rate = payload.get("heart_rate")
    spO2 = payload.get("spO2")

    if session_id:
        assert_session_access(current_user, session_id)

    if not all([session_id, heart_rate, spO2]):
        raise HTTPException(status_code=400, detail="Missing required vitals: session_id, heart_rate, spO2")

    try:
        # 1. Programmatically update LangGraph thread state
        thread_config = {"configurable": {"thread_id": session_id}}
        updated_profile = {
            "vitals": {
                "heart_rate": heart_rate,
                "spO2": spO2
            }
        }
        
        # Intercept logic for critical thresholds
        emergency_triggered = False
        if heart_rate > 120 or spO2 < 92:
            logger.warning(f"CRITICAL VITALS DETECTED for session {session_id}: HR={heart_rate}, spO2={spO2}")
            emergency_triggered = True
            
            # Update DB triage session to EMERGENCY_ROOM
            # Fixed: Added () to execute() to ensure the query actually runs.
            await asyncio.to_thread(
                db_client.client.table("triage_sessions")
                .update({"care_level": CareLevel.EMERGENCY_ROOM.value, "risk_score": 10})
                .eq("id", session_id)
                .execute()
            )
            
            # Inject emergency flag into the graph state
            get_graph_engine().executor.update_state(
                thread_config, 
                {"profile": updated_profile, "emergency_override": True}
            )
        else:
            # Standard state update
            get_graph_engine().executor.update_state(
                thread_config, 
                {"profile": updated_profile}
            )

        return {
            "status": "synchronized",
            "emergency_detected": emergency_triggered,
            "session_id": session_id
        }

    except Exception as e:
        logger.error(f"Wearable sync failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Vitals synchronization exception.")
