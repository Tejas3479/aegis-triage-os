import logging
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import MentalHealthAssessment
from app.services.database import db_client
from app.core.auth import get_current_user, User, assert_session_access
from app.services.consent_guard import require_active_consent

router = APIRouter()
logger = logging.getLogger("aegis_core")


@router.post("/assessment/{session_id}")
async def submit_assessment(
    session_id: str,
    assessment: MentalHealthAssessment,
    current_user: User = Depends(get_current_user),
):
    assert_session_access(current_user, session_id)
    require_active_consent(session_id)

    try:
        await asyncio.to_thread(
            lambda: db_client.client.table("triage_sessions")
            .update({"mental_health_flag": True})
            .eq("id", session_id)
            .execute()
        )

        await asyncio.to_thread(
            lambda: db_client.client.table("medical_audit_logs")
            .insert(
                {
                    "session_id": session_id,
                    "symptoms": {"mental_health": assessment.model_dump()},
                    "model_metadata": {"assessment_type": "formal_psychometric"},
                }
            )
            .execute()
        )

        return {
            "status": "logged",
            "session_id": session_id,
            "clinical_depression_risk": assessment.clinical_depression_risk,
            "self_harm_flag": assessment.self_harm_flag,
        }
    except Exception as e:
        logger.error("Assessment submission failed: %s", e)
        raise HTTPException(status_code=500, detail="Audit log persistence error.")
