import logging

from fastapi import HTTPException, status

from app.core.database import db_client
from app.domains.triage.triage_persistence import ensure_patient_for_session

logger = logging.getLogger("aegis_core")


def require_active_consent(session_id: str) -> None:
    """Raises 403 if DPDP consent has not been recorded for this session."""
    if not db_client.client:
        logger.warning("Consent guard skipped: database unavailable.")
        return

    patient_id = ensure_patient_for_session(session_id)
    if not patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consent required before clinical triage. Please accept the privacy notice.",
        )

    response = (
        db_client.client.table("dpdp_consent_logs")
        .select("id")
        .eq("patient_id", patient_id)
        .eq("is_revoked", False)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consent required before clinical triage. Please accept the privacy notice.",
        )
