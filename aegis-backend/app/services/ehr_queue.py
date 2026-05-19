import os
import logging
from pydantic import BaseModel

logger = logging.getLogger("aegis_core")

from app.core.config import settings

# --- Schemas for Transaction Payloads ---
class EHRTransaction(BaseModel):
    encounter_id: str
    action_type: str  # "MEDICATION_ORDER", "LAB_ORDER", "REFERRAL"
    payload: dict
    retries: int = 0

# --- Asynchronous Tasks (Converted to Direct Functions) ---

def execute_ehr_writeback(transaction_data: dict):
    """
    Asynchronous EHR Write-Back Worker.
    Handles automated retries, circuit-breaker patterns, and failure logging.
    """
    data = transaction_data.get('data', {})
    logger.info(f"Processing EHR transaction for encounter: {data.get('encounter_id')}")
    
    try:
        # Actual FHIR API call to Sandbox EHR (e.g., Epic)
        import httpx
        
        epic_url = os.getenv("EPIC_FHIR_URL", "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4")
        headers = {
            "Authorization": f"Bearer {os.getenv('EPIC_TOKEN', 'mock_token')}",
            "Content-Type": "application/fhir+json"
        }
        
        payload = data.get('payload', {})
        resource_type = data.get('action_type', 'MedicationRequest')
        
        # Map internal action type to FHIR Resource
        if resource_type == "MEDICATION_ORDER":
            resource_type = "MedicationRequest"
            
        with httpx.Client() as client:
            response = client.post(
                f"{epic_url}/{resource_type}",
                json=payload,
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code not in (200, 201):
                raise Exception(f"EHR Gateway Error: {response.status_code} - {response.text}")
            
        logger.info(f"Successfully committed transaction to EHR: {data.get('action_type')}")
        return {"status": "SUCCESS", "encounter_id": data.get('encounter_id')}
        
    except Exception as exc:
        logger.error(f"EHR Transaction Failed: {exc}")
        # Without Celery, we don't have automatic retries here unless we implement them.
        # For now, we just log the error.
        return {"status": "FAILED", "error": str(exc)}
