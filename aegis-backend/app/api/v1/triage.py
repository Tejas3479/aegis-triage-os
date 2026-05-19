import logging
import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Form, File, UploadFile
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from app.domains.triage.graph_engine import get_graph_engine
from app.core.auth import get_current_user, User, assert_session_access
from app.security.pii_vault import pii_vault
from app.security.consent_guard import require_active_consent
from app.workers.tasks import compile_health_report
from app.domains.triage.triage_persistence import persist_triage_outcome, build_triage_response
from app.models.schemas import MentalHealthAssessment
from app.core.database import db_client
import asyncio

router = APIRouter(tags=["Triage Ingestion"])
logger = logging.getLogger("aegis_core")

class ChatMessageInput(BaseModel):
    session_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    medical_history: List[str] = []
    latitude: float = 13.1008  # Default coordinates anchor to Yelahanka, Bengaluru
    longitude: float = 77.5963

class WizardTriageInput(BaseModel):
    session_id: str = Field(..., min_length=1)
    chief_complaint: str = Field(..., min_length=1, max_length=200)
    pain_score: int = Field(..., ge=0, le=10)
    duration: str = Field(..., min_length=1, max_length=100)
    risk_factors: List[str] = Field(default_factory=list)

@router.post("/chat")
async def execute_agent_triage_turn(
    payload: ChatMessageInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Executes a clinical triage turn using the hardened Multi-Agent Supervisor Graph.
    Verifies session access and consent before processing.
    """
    assert_session_access(current_user, payload.session_id)
    require_active_consent(payload.session_id)
    
    clean_message = pii_vault.redact_input(payload.content)
    
    # Resolve patient profile from MPI/EHR
    from app.services.mpi import mpi
    patient_profile = await mpi.resolve_patient_profile(payload.session_id)
    
    from app.harness.gatekeeper import gatekeeper
    emergency_bypass = gatekeeper.check_for_bypass(clean_message)
    if emergency_bypass:
        logger.warning(f"Emergency bypass triggered for session {payload.session_id}")
    
    # Initialize state dictionary for the LangGraph engine
    initial_state = {
        "session_id": payload.session_id,
        "profile": patient_profile,
        "physical_exam": [],
        "chat_history": [{"role": "user", "content": clean_message}],
        "agent_logs": [],
        "executed_steps": set(),
        "next_step": "master_supervisor",
        "raw_user_input": clean_message,
        "sanitized_english_input": "",
        "target_iso_code": "en",
        "emergency_override": emergency_bypass,
        "telemedicine_routing_required": False,
        "telemedicine_url": ""
    }
    
    try:
        # Run graph sequentially via the multi-agent loop
        output_state = await get_graph_engine().executor.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": payload.session_id}}
        )
        
        # Trigger background report generation
        background_tasks.add_task(compile_health_report, payload.session_id)
        
        # Persist results
        try:
            persist_triage_outcome(payload.session_id, output_state)
        except Exception as db_err:
            logger.warning(f"Persistence failure: {db_err}")

        # Return standardized response for frontend consumption
        return {
            "session_id": output_state.get("session_id"),
            "final_analysis": output_state.get("final_analysis"),
            "telemedicine_url": output_state.get("telemedicine_url"),
            "telemedicine_routing_required": output_state.get("telemedicine_routing_required"),
            "agent_logs": output_state.get("agent_logs", []),
            "clinical_scribe_output": output_state.get("clinical_scribe_output"),
            "auditable_encounter": output_state.get("auditable_encounter"),
            "biomarker_variance": output_state.get("biomarker_variance")
        }
        
    except Exception as e:
        logger.error(f"Graph orchestration failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clinical engine fault: {str(e)}")

@router.post("/wizard")
async def execute_wizard_triage(
    payload: WizardTriageInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Executes a structured triage wizard flow.
    """
    assert_session_access(current_user, payload.session_id)
    require_active_consent(payload.session_id)
    
    narrative = f"Chief complaint: {payload.chief_complaint}. Pain level: {payload.pain_score}/10. Duration: {payload.duration}. Risk factors: {', '.join(payload.risk_factors) if payload.risk_factors else 'None'}."
    
    from app.harness.gatekeeper import gatekeeper
    emergency_bypass = gatekeeper.check_for_bypass(narrative)
    
    CRITICAL_RISKS = ["chest_pain", "breathing_difficulty", "severe_bleeding", "unconsciousness"]
    if any(risk in payload.risk_factors for risk in CRITICAL_RISKS):
        emergency_bypass = True
        
    if emergency_bypass:
        logger.warning(f"Emergency bypass triggered for session {payload.session_id}")
        
    from app.services.mpi import mpi
    patient_profile = await mpi.resolve_patient_profile(payload.session_id)
    
    initial_state = {
        "session_id": payload.session_id,
        "profile": patient_profile,
        "physical_exam": [],
        "chat_history": [{"role": "user", "content": narrative}],
        "agent_logs": [],
        "executed_steps": set(),
        "next_step": "master_supervisor",
        "raw_user_input": narrative,
        "sanitized_english_input": "",
        "target_iso_code": "en",
        "emergency_override": emergency_bypass,
        "telemedicine_routing_required": False,
        "telemedicine_url": ""
    }
    
    try:
        output_state = await get_graph_engine().executor.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": payload.session_id}}
        )
        
        await asyncio.to_thread(
            lambda: db_client.client.table("medical_audit_logs")
            .insert(
                {
                    "session_id": payload.session_id,
                    "symptoms": {"wizard_data": payload.model_dump()},
                    "model_metadata": {"source": "wizard"},
                }
            )
            .execute()
        )
        
        background_tasks.add_task(compile_health_report, payload.session_id)
        
        try:
            persist_triage_outcome(payload.session_id, output_state)
        except Exception as db_err:
            logger.warning(f"Persistence failure: {db_err}")
            
        return {
            "session_id": output_state.get("session_id"),
            "final_analysis": output_state.get("final_analysis"),
            "telemedicine_url": output_state.get("telemedicine_url"),
            "telemedicine_routing_required": output_state.get("telemedicine_routing_required"),
            "agent_logs": output_state.get("agent_logs", []),
            "clinical_scribe_output": output_state.get("clinical_scribe_output"),
            "auditable_encounter": output_state.get("auditable_encounter"),
            "biomarker_variance": output_state.get("biomarker_variance")
        }
        
    except Exception as e:
        logger.error(f"Graph orchestration failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clinical engine fault: {str(e)}")

@router.post("/voice")
async def execute_voice_triage(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests an audio file, transcribes it, and runs the triage graph.
    """
    assert_session_access(current_user, session_id)
    require_active_consent(session_id)
    
    import tempfile
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name
        
    try:
        from app.core.local_stt import transcribe_audio
        text = await transcribe_audio(temp_file_path)
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio.")
            
        from app.services.mpi import mpi
        patient_profile = await mpi.resolve_patient_profile(session_id)
        
        from app.harness.gatekeeper import gatekeeper
        emergency_bypass = gatekeeper.check_for_bypass(text)
        
        initial_state = {
            "session_id": session_id,
            "profile": patient_profile,
            "physical_exam": [],
            "chat_history": [{"role": "user", "content": text}],
            "agent_logs": [],
            "executed_steps": set(),
            "next_step": "master_supervisor",
            "raw_user_input": text,
            "sanitized_english_input": "",
            "target_iso_code": "en",
            "emergency_override": emergency_bypass,
            "telemedicine_routing_required": False,
            "telemedicine_url": ""
        }
        
        graph_engine = get_graph_engine()
        output_state = await graph_engine.ainvoke(initial_state)
        
        return {
            "response": "Voice triage processed.",
            "state": {
                "systemStatus": output_state.get("system_status", "AWAITING_PHYSICIAN_APPROVAL"),
                "detectedSymptoms": output_state.get("extracted_symptoms", [])
            },
            "chat_history": output_state.get("chat_history", []),
            "agent_logs": output_state.get("agent_logs", [])
        }
        
    except Exception as e:
        logger.error(f"Voice triage failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice triage fault: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.post("/deliberate/{session_id}")
async def execute_deliberation(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Compiles the stored transcript and runs the LangGraph workflow.
    Triggered when the provider hits 'Deliberate' on the HUD.
    """
    assert_session_access(current_user, session_id)
    require_active_consent(session_id)
    
    file_path = f"storage/transcripts/{session_id}.txt"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="No transcript found for this session.")
        
    with open(file_path, "r") as f:
        transcript = f.read()
        
    # Resolve patient profile from MPI/EHR
    from app.services.mpi import mpi
    patient_profile = await mpi.resolve_patient_profile(session_id)
    
    # Initialize state with the full transcript as user input
    initial_state = {
        "session_id": session_id,
        "profile": patient_profile,
        "physical_exam": [],
        "chat_history": [{"role": "user", "content": transcript}],
        "agent_logs": [],
        "executed_steps": set(),
        "next_step": "master_supervisor",
        "raw_user_input": transcript,
        "sanitized_english_input": "",
        "target_iso_code": "en",
        "emergency_override": False,
        "telemedicine_routing_required": False,
        "telemedicine_url": ""
    }
    
    try:
        from app.domains.triage.graph_engine import get_graph_engine
        output_state = await get_graph_engine().executor.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": session_id}}
        )
        
        return {
            "session_id": output_state.get("session_id"),
            "final_analysis": output_state.get("final_analysis"),
            "agent_logs": output_state.get("agent_logs", []),
            "clinical_scribe_output": output_state.get("clinical_scribe_output")
        }
        
    except Exception as e:
        logger.error(f"Deliberation failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clinical engine fault: {str(e)}")

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

@router.get("/outcome/{session_id}")
async def get_triage_outcome_endpoint(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the persisted triage outcome for a session.
    """
    assert_session_access(current_user, session_id)
    
    try:
        from app.domains.triage.triage_persistence import get_triage_outcome
        outcome = get_triage_outcome(session_id)
        if not outcome:
            raise HTTPException(status_code=404, detail="Session not found.")
        return outcome
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch outcome: {e}")
        raise HTTPException(status_code=500, detail="Database fetch error.")
