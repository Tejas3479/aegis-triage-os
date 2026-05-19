from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import uuid
import logging
from app.domains.triage.graph_engine import get_graph_engine, init_graph_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2/clinical", tags=["Clinical ICE Hub"])

class PatientEncounterInput(BaseModel):
    session_id: Optional[str] = None
    patient_narrative: str
    active_diagnoses: List[str] = []
    heart_rate_input: int = 72
    spo2_input: int = 98

@router.post("/process-encounter")
async def process_clinical_encounter(payload: PatientEncounterInput):
    """
    Ingests raw patient telemetry and narrative to generate a prescriptive ICE assessment.
    This resolves the Asymmetric Information & Hand-off Crisis.
    """
    if not payload.patient_narrative.strip():
        raise HTTPException(status_code=400, detail="Patient narrative cannot be empty.")
        
    session_id = payload.session_id or str(uuid.uuid4())
    
    initial_runtime_state = {
        "session_id": session_id,
        "raw_user_input": payload.patient_narrative,
        "profile": {
            "medical_history": payload.active_diagnoses,
            "vitals": {
                "heart_rate": payload.heart_rate_input,
                "spO2": payload.spo2_input
            }
        },
        "next_step": "baseline_sentinel",
        "executed_steps": set(),
        "agent_logs": []
    }
    
    try:
        # Use existing global engine
        engine = get_graph_engine().executor
        
        # Execute ICE Multi-Agent Deliberation
        engine_output = await engine.ainvoke(initial_runtime_state)
        
        # Convert set to list for JSON serialization
        if "executed_steps" in engine_output:
            engine_output["executed_steps"] = list(engine_output["executed_steps"])

        return {
            "session_id": session_id,
            "auditable_clinical_encounter": engine_output.get("auditable_encounter"),
            "telemedicine_escalation": {
                "routing_required": engine_output.get("telemedicine_routing_required", False),
                "live_session_url": f"https://aegis.os/clinical/telehealth/{session_id}" if engine_output.get("telemedicine_routing_required") else None
            },
            "agent_deliberation_logs": engine_output.get("agent_logs", [])
        }
    except Exception as e:
        logger.error(f"ICE Engine Execution Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clinical transaction failure: {str(e)}")
