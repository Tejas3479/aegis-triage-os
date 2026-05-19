import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.rate_limit import check_rate_limit
from app.core.database import db_client
from app.domains.triage.triage_persistence import ensure_patient_for_session

router = APIRouter()
logger = logging.getLogger("aegis_core")

CONSENT_PURPOSES = [
    "ai_clinical_triage",
    "symptom_assessment",
    "mental_health_screening",
    "epidemiological_anonymized_analytics",
]


class ConsentRecordRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    purpose_agreed: str = Field(
        default="ai_clinical_triage,symptom_assessment,mental_health_screening,epidemiological_anonymized_analytics"
    )


class ConsentRevokeRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


def _hash_client_ip(request: Request) -> str:
    client = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    raw = forwarded or client
    return hashlib.sha256(raw.encode()).hexdigest()


@router.post("/consent/record")
async def record_dpdp_consent(http_request: Request, body: ConsentRecordRequest):
    """
    Records DPDP-aligned consent before any clinical processing for a session.
    Public endpoint (rate-limited); does not require JWT.
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"consent:{client_ip}", max_requests=20, window_seconds=60)

    if not db_client.client:
        logger.warning("Database unavailable; returning dummy consent success.")
        return {"status": "success", "patient_id": "dummy-patient-id"}

    patient_id = ensure_patient_for_session(body.session_id)
    if not patient_id:
        raise HTTPException(status_code=500, detail="Could not provision anonymous patient record.")

    purposes = [p.strip() for p in body.purpose_agreed.split(",") if p.strip()]
    invalid = [p for p in purposes if p not in CONSENT_PURPOSES]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid consent purpose(s): {', '.join(invalid)}",
        )

    ip_hashed = _hash_client_ip(http_request)
    now = datetime.now(timezone.utc).isoformat()

    db_client.client.table("dpdp_consent_logs").insert(
        {
            "patient_id": patient_id,
            "consent_timestamp": now,
            "purpose_agreed": body.purpose_agreed,
            "ip_address_hashed": ip_hashed,
            "is_revoked": False,
        }
    ).execute()

    logger.info("DPDP consent recorded for session %s", body.session_id)
    return {
        "status": "recorded",
        "session_id": body.session_id,
        "patient_id": patient_id,
        "consent_timestamp": now,
    }


@router.get("/consent/status/{session_id}")
async def consent_status(session_id: str):
    """Check whether active (non-revoked) consent exists for a session's patient."""
    if not db_client.client:
        return {"session_id": session_id, "has_consent": False}

    patient_id = ensure_patient_for_session(session_id)
    if not patient_id:
        return {"session_id": session_id, "has_consent": False}

    response = (
        db_client.client.table("dpdp_consent_logs")
        .select("id, is_revoked, consent_timestamp")
        .eq("patient_id", patient_id)
        .eq("is_revoked", False)
        .order("consent_timestamp", desc=True)
        .limit(1)
        .execute()
    )
    has_consent = bool(response.data)
    return {
        "session_id": session_id,
        "has_consent": has_consent,
        "consent_timestamp": response.data[0]["consent_timestamp"] if has_consent else None,
    }


@router.post("/consent/revoke")
async def revoke_consent(http_request: Request, body: ConsentRevokeRequest):
    """Revoke consent for the patient linked to this session."""
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"consent-revoke:{client_ip}", max_requests=10, window_seconds=60)

    if not db_client.client:
        raise HTTPException(status_code=503, detail="Consent service unavailable.")

    patient_id = ensure_patient_for_session(body.session_id)
    if not patient_id:
        raise HTTPException(status_code=404, detail="No patient record for session.")

    db_client.client.table("dpdp_consent_logs").update({"is_revoked": True}).eq(
        "patient_id", patient_id
    ).eq("is_revoked", False).execute()

    # Critical Integration: The Revocation Hook
    try:
        from app.domains.triage.graph_engine import get_graph_engine
        graph = get_graph_engine()
        config = {"configurable": {"thread_id": body.session_id}}
        await graph.update_state(config, {"system_status": "UNAUTHORIZED"})
        logger.info(f"Revocation hook triggered: State updated to UNAUTHORIZED for session {body.session_id}")
    except Exception as e:
        logger.warning(f"Failed to update graph state on revocation: {str(e)}")

    return {
        "status": "revoked", 
        "session_id": body.session_id,
        "message": "Consent revoked and active threads paused."
    }

from app.services.mpi import mpi

from app.security.ledger import ledger

@router.get("/profile/{session_id}")
async def get_patient_profile(session_id: str):
    """Fetch patient profile (allergies, meds) for the HUD."""
    try:
        profile = await mpi.resolve_patient_profile(session_id)
        # Convert list of strings to list of objects for frontend PatientCompass
        profile_dict = {
            "age": profile.age,
            "gender": profile.gender,
            "medical_history": profile.medical_history,
            "current_meds": profile.current_meds,
            "latitude": profile.latitude,
            "longitude": profile.longitude,
            "known_allergies": [{"name": a} for a in profile.known_allergies],
            "allergies": [{"name": a} for a in profile.known_allergies],
            "medications": [{"name": m} for m in profile.current_meds],
            "chronic_conditions": [{"name": c} for c in profile.medical_history]
        }
        return profile_dict
    except Exception as e:
        logger.error(f"Failed to fetch patient profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patient profile.")

class DeleteDataRequest(BaseModel):
    anon_hash: str = Field(..., min_length=64, max_length=64)

@router.delete("/data")
async def delete_patient_data(http_request: Request, body: DeleteDataRequest):
    """
    DPDP Right to be Forgotten: Wipes all records for a given anon_hash.
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"delete_data:{client_ip}", max_requests=5, window_seconds=60)

    if not db_client.client:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    # 1. Find patient by anon_hash
    response = db_client.client.table("patients").select("id").eq("anon_hash", body.anon_hash).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Patient not found.")
        
    patient_id = response.data[0]["id"]
    
    # 2. Find sessions to delete from audit logs
    sessions_resp = db_client.client.table("triage_sessions").select("id").eq("patient_id", patient_id).execute()
    session_ids = [s["id"] for s in sessions_resp.data] if sessions_resp.data else []
    
    # 3. Delete records in order of dependency
    if session_ids:
        db_client.client.table("medical_audit_logs").delete().in_("session_id", session_ids).execute()
        
    db_client.client.table("triage_sessions").delete().eq("patient_id", patient_id).execute()
    db_client.client.table("dpdp_consent_logs").delete().eq("patient_id", patient_id).execute()
    db_client.client.table("patients").delete().eq("id", patient_id).execute()
    
    # 4. Log the deletion event
    logger.info(f"DPDP Delete: Wiped all records for patient_id {patient_id} (anon_hash: {body.anon_hash})")
    await ledger.log_event("PATIENT_DATA_DELETION", "SYSTEM", {"anon_hash": body.anon_hash})
    
    return {
        "status": "success",
        "message": f"All records for anon_hash {body.anon_hash} have been permanently deleted."
    }
