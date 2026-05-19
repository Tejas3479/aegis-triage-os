import hashlib
import logging
import json
from typing import Any, Dict, Optional
from app.core.security import security_engine

from app.core.database import db_client
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
    analysis = analysis_to_dict(result.get("final_analysis"))
    response: Dict[str, Any] = {
        "session_id": str(session_id),
        "care_level": normalize_care_level(analysis.get("care_level")),
        "guidance_notes": analysis.get("guidance_notes", "Analysis pending."),
        "extracted_symptoms": analysis.get("extracted_symptoms", []) or [],
        "telemedicine_url": result.get("telemedicine_url") or None,
        "status": "processed",
        "risk_score": normalize_risk_score(analysis.get("risk_score")),
        "auditable_encounter": result.get("auditable_encounter"),
        "biomarker_variance": result.get("biomarker_variance")
    }
    if transcription is not None:
        response["transcription"] = transcription
    return response


def ensure_patient_for_session(session_id: str, latitude: float = DEFAULT_LATITUDE, longitude: float = DEFAULT_LONGITUDE) -> Optional[str]:
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
                "geo_latitude": latitude,
                "geo_longitude": longitude,
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

    analysis = analysis_to_dict(result.get("final_analysis"))
    
    # Extract location from profile in state
    profile = result.get("profile", {})
    # Handle profile being a dict or object
    if hasattr(profile, "get"):
        latitude = profile.get("latitude", DEFAULT_LATITUDE)
        longitude = profile.get("longitude", DEFAULT_LONGITUDE)
    else:
        latitude = getattr(profile, "latitude", DEFAULT_LATITUDE)
        longitude = getattr(profile, "longitude", DEFAULT_LONGITUDE)

    patient_id = ensure_patient_for_session(session_id, latitude, longitude)
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
    
    # Encrypt sensitive data for PHI protection at rest
    encrypted_str = security_engine.encrypt_pii(json.dumps(symptoms_payload))
    
    db_client.client.table("medical_audit_logs").insert(
        {
            "session_id": str(session_id),
            "symptoms": {"encrypted_data": encrypted_str},
            "model_metadata": {
                "source": "langgraph_guardian_ice",
                "care_level": care_level,
                "risk_score": risk_score,
                "auditable_encounter": result.get("auditable_encounter"),
                "biomarker_variance": result.get("biomarker_variance")
            },
        }
    ).execute()

    logger.info("Persisted triage outcome for session %s", session_id)

def get_triage_outcome(session_id: str) -> Dict[str, Any]:
    if not db_client.client:
        return {}
        
    response = db_client.client.table("triage_sessions").select("*").eq("id", session_id).execute()
    if response.data:
        session = response.data[0]
        
        # Also fetch audit logs to get symptoms and notes
        audit_resp = db_client.client.table("medical_audit_logs").select("*").eq("session_id", session_id).execute()
        
        if audit_resp.data:
            audit = audit_resp.data[0]
            symptoms = audit.get("symptoms", {})
            
            # Decrypt if encrypted
            if isinstance(symptoms, dict) and "encrypted_data" in symptoms:
                try:
                    decrypted_str = security_engine.decrypt_pii(symptoms["encrypted_data"])
                    symptoms = json.loads(decrypted_str)
                except Exception as e:
                    logger.error(f"Failed to decrypt symptoms for session {session_id}: {e}")
                    symptoms = {}
                    
            return {
                "session_id": session_id,
                "care_level": session.get("care_level"),
                "risk_score": session.get("risk_score"),
                "status": session.get("status"),
                "mental_health_flag": session.get("mental_health_flag"),
                "guidance_notes": symptoms.get("guidance_notes", ""),
                "extracted_symptoms": symptoms.get("extracted_symptoms", []),
                "clinical_reasoning": symptoms.get("clinical_reasoning", ""),
                "auditable_encounter": audit.get("model_metadata", {}).get("auditable_encounter")
            }
            
        return session
    return {}
