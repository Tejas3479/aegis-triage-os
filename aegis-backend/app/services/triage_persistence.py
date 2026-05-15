import hashlib
import logging
from typing import Any, Dict, Optional

from app.services.database import db_client
from app.models.schemas import CareLevel

logger = logging.getLogger("aegis_core")

DEFAULT_LATITUDE = 12.9716
DEFAULT_LONGITUDE = 77.5946
VALID_CARE_LEVELS = {c.value for c in CareLevel}


def analysis_to_dict(analysis: Any) -> Dict[str, Any]:
    if analysis is None:
        return {}
    if hasattr(analysis, "model_dump"):
        return analysis.model_dump()
    if hasattr(analysis, "dict"):
        return analysis.dict()
    if isinstance(analysis, dict):
        return analysis
    return {}


def normalize_care_level(raw: Any) -> str:
    value = raw.value if hasattr(raw, "value") else str(raw or "CLINIC_VISIT")
    if value not in VALID_CARE_LEVELS:
        return CareLevel.CLINIC_VISIT.value
    return value


def normalize_risk_score(raw: Any) -> int:
    try:
        score = int(raw or 0)
    except (TypeError, ValueError):
        return 0
    return min(max(score, 0), 10)


def build_triage_response(
    session_id: str,
    result: Dict[str, Any],
    transcription: Optional[str] = None,
) -> Dict[str, Any]:
    analysis = analysis_to_dict(result.get("analysis"))
    response: Dict[str, Any] = {
        "session_id": str(session_id),
        "care_level": normalize_care_level(analysis.get("care_level")),
        "guidance_notes": analysis.get("guidance_notes", "Analysis pending."),
        "extracted_symptoms": analysis.get("extracted_symptoms", []) or [],
        "telemedicine_url": result.get("telemedicine_url") or None,
        "status": "processed",
    }
    if transcription is not None:
        response["transcription"] = transcription
    return response


def _ensure_patient_for_session(session_id: str) -> Optional[str]:
    if not db_client.client:
        return None

    anon_hash = hashlib.sha256(session_id.encode()).hexdigest()
    existing = (
        db_client.client.table("patients")
        .select("id")
        .eq("anon_hash", anon_hash)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]["id"]

    created = (
        db_client.client.table("patients")
        .insert(
            {
                "anon_hash": anon_hash,
                "geo_latitude": DEFAULT_LATITUDE,
                "geo_longitude": DEFAULT_LONGITUDE,
            }
        )
        .execute()
    )
    if created.data:
        return created.data[0]["id"]
    return None


def persist_triage_outcome(session_id: str, result: Dict[str, Any]) -> None:
    if not db_client.client:
        logger.warning("Database client unavailable; skipping triage persistence.")
        return

    analysis = analysis_to_dict(result.get("analysis"))
    patient_id = _ensure_patient_for_session(session_id)
    if not patient_id:
        logger.warning("Could not resolve patient for session %s", session_id)
        return

    care_level = normalize_care_level(analysis.get("care_level"))
    risk_score = normalize_risk_score(analysis.get("risk_score"))
    mental_health_flag = bool(analysis.get("mental_health_flag", False))

    db_client.client.table("triage_sessions").upsert(
        {
            "id": str(session_id),
            "patient_id": patient_id,
            "care_level": care_level,
            "risk_score": risk_score,
            "status": "ACTIVE",
            "mental_health_flag": mental_health_flag,
        }
    ).execute()

    symptoms_payload = {
        "extracted_symptoms": analysis.get("extracted_symptoms", []),
        "guidance_notes": analysis.get("guidance_notes", ""),
        "clinical_reasoning": analysis.get("clinical_reasoning", ""),
    }
    db_client.client.table("medical_audit_logs").insert(
        {
            "session_id": str(session_id),
            "symptoms": symptoms_payload,
            "model_metadata": {
                "source": "langgraph_triage",
                "care_level": care_level,
                "risk_score": risk_score,
            },
        }
    ).execute()

    logger.info("Persisted triage outcome for session %s", session_id)
