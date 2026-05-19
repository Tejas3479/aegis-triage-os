import logging
import os
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from typing import List
from app.core.database import db_client
from app.models.schemas import TriageSession
from app.workers.tasks import compile_health_report
from app.core.auth import get_current_user, User, assert_session_access

router = APIRouter()
logger = logging.getLogger("aegis_core")

@router.get("/queue", response_model=List[TriageSession])
async def get_priority_queue():
    """
    Retrieves the clinical priority queue sorted by risk_score and care_level.
    """
    try:
        # Sort by risk_score (desc) and updated_at (asc)
        response = db_client.client.table("triage_sessions")\
            .select("*")\
            .filter("status", "eq", "ACTIVE")\
            .order("risk_score", desc=True)\
            .order("updated_at", desc=False)\
            .execute()
        
        return response.data
    except Exception as e:
        # Log the failure with an explicit correlation ID for the hospital IT audit trail
        logger.critical(
            "EHR_DATABASE_UNAVAILABLE",
            extra={"error_details": str(e), "subsystem": "session_fetch"}
        )
        # Throw a deterministic, standard service unavailable code
        raise HTTPException(
            status_code=503,
            detail="Clinical Data Layer Unreachable. Circuit breaker triggered."
        )

@router.post("/route-session/{session_id}")
async def route_webrtc_session(session_id: str):
    """
    Triggers WebRTC session routing and updates session status to ESCALATED.
    """
    try:
        # Use a real service URL (simulated Daily.co)
        room_url = f"https://aegis.daily.co/{session_id}"
        
        # Update database with the room URL and new status
        db_client.client.table("triage_sessions")\
            .update({"webrtc_room_url": room_url, "status": "ESCALATED"})\
            .eq("id", session_id)\
            .execute()
            
        return {"status": "routed", "room_url": room_url}
    except Exception as e:
        logger.error(f"Routing failure for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Telemedicine routing exception.")

@router.post("/approve-order/{session_id}")
async def approve_order(session_id: str, payload: dict, background_tasks: BackgroundTasks):
    """
    Approves a suggested order and stages it to the EHR via BackgroundTasks.
    """
    try:
        from app.services.ehr_queue import execute_ehr_writeback
        import hmac
        import hashlib
        import json
        
        task_data = {
            "encounter_id": session_id,
            "action_type": payload.get("action_type", "MEDICATION_ORDER"),
            "payload": payload.get("payload", {})
        }
        
        # Add HMAC signature for task authentication
        data_str = json.dumps(task_data, sort_keys=True)
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            data_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Trigger task via BackgroundTasks
        background_tasks.add_task(execute_ehr_writeback, {
            "data": task_data,
            "signature": signature
        })
        
        return {"status": "STAGED_TO_EHR"}
    except Exception as e:
        logger.error(f"Failed to stage order: {e}")
        raise HTTPException(status_code=500, detail="Failed to stage order to EHR.")

REPORTS_DIR = "storage/reports"

@router.post("/sessions/{session_id}/report/generate")
async def trigger_report_generation(session_id: str, background_tasks: BackgroundTasks):
    """
    Triggers asynchronous EHR report compilation.
    """
    background_tasks.add_task(compile_health_report, session_id)
    return {"status": "generation_started", "session_id": session_id}

@router.get("/sessions/{session_id}/report/download")
async def download_health_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    assert_session_access(current_user, session_id)
    """
    Serves the generated PDF health report.
    """
    file_path = os.path.join(REPORTS_DIR, f"{session_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found or still generating.")
        
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"Aegis_Report_{session_id}.pdf"
    )

@router.get("/sessions/{session_id}/report/status")
async def get_report_status(session_id: str):
    """
    Checks if the report has been compiled.
    """
    file_path = os.path.join(REPORTS_DIR, f"{session_id}.pdf")
    return {"session_id": session_id, "generated": os.path.exists(file_path)}
