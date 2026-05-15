import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.rate_limit import check_rate_limit
from app.services.database import db_client
from app.services.triage_persistence import ensure_patient_for_session

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


@router.post("/record")
async def record_dpdp_consent(http_request: Request, body: ConsentRecordRequest):
    """
    Records DPDP-aligned consent before any clinical processing for a session.
    Public endpoint (rate-limited); does not require JWT.
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    check_rate_limit(f"consent:{client_ip}", max_requests=20, window_seconds=60)

    if not db_client.client:
        raise HTTPException(status_code=503, detail="Consent service unavailable.")

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


@router.get("/status/{session_id}")
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


@router.post("/revoke")
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

    return {"status": "revoked", "session_id": body.session_id}
