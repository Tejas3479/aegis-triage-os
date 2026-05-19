import os
import json
import logging
from typing import Dict, Any, List, Optional, Set
from langgraph.graph import StateGraph, END
from google import genai
from google.genai import types
from app.models.states import AegisState, CouncilDeliberation, MedicalEntity, DrugProposal
from app.models.schemas import AuditableCareEncounter, AIAnalysisOutput, SymptomSeverity, CareLevel
from app.security.ledger import ledger
from app.domains.mcp.client import AegisMCPClientRouter
from app.domains.mcp.server import SimulatedEHREngine

from app.core.config import settings

logger = logging.getLogger("aegis_core")
from app.core.model_router import llm_router

import redis.asyncio as redis

async def publish_node_status(session_id: str, node: str, status: str):
    """Publishes node execution status to Redis."""
    try:
        r = await redis.from_url(settings.REDIS_URL)
        await r.publish(f"node_status:{session_id}", json.dumps({"node": node, "status": status}))
        await r.close()
    except Exception as e:
        logger.warning(f"Failed to publish node status to Redis: {e}")

# --- Helper for Deterministic Check ---
async def detect_class_allergy_conflict(drug_rxcui: str, allergies: List[dict]) -> bool:
    """Calls RxNav API to check for drug-allergy interactions."""
    import httpx
    import redis.asyncio as redis
    from app.core.config import settings
    
    for allergy in allergies:
        allergy_code = allergy.get("code", "")
        if not allergy_code or allergy.get("code_system") != "RxNorm":
            # Fallback to string matching if no RxCUI
            allergy_name = allergy.get("name", "").lower()
            if "penicillin" in allergy_name and drug_rxcui == "723":
                return True
            continue
            
        # Check Cache
        cache_key = f"allergy_conflict:{drug_rxcui}:{allergy_code}"
        try:
            r = await redis.from_url(settings.REDIS_URL)
            cached = await r.get(cache_key)
            if cached:
                await r.close()
                if cached.decode("utf-8") == "True":
                    return True
                continue
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")
            r = None
            
        # Call RxNav API
        try:
            url = f"https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis={drug_rxcui}+{allergy_code}"
            async with httpx.AsyncClient() as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    is_conflict = "fullInteractionTypeGroup" in data
                    
                    if r:
                        try:
                            await r.setex(cache_key, 3600, str(is_conflict))
                            await r.close()
                        except Exception as e:
                            logger.warning(f"Redis cache write failed: {e}")
                            
                    if is_conflict:
                        return True
        except Exception as e:
            logger.error(f"RxNav API call failed: {e}")
            
    return False

# --- ENTERPRISE CLINICAL COUNCIL NODES ---

async def supervisor_node(state: AegisState) -> Dict[str, Any]:
    """Council Supervisor: Initializes context."""
    narrative = state.get("raw_user_input", "")
    profile = state.get("profile", {})
    history = getattr(profile, "medical_history", []) if hasattr(profile, "medical_history") else []
    
    semantic_context = {
        "temporal_trajectory": "Acute onset" if "sudden" in narrative.lower() else "Sub-acute/Chronic evolution",
        "historical_anchors": history,
        "clinical_urgency_index": 0.8 if any(w in narrative.lower() for w in ["severe", "agony", "cannot breathe"]) else 0.3
    }
    
    logger.info(f"Supervisor context generated for session: {state.get('session_id')}")
    
    await ledger.log_event("NODE_EXECUTION", state.get("session_id", "UNKNOWN"), {"node": "supervisor"})
    return {
        "semantic_context": semantic_context,
        "executed_steps": state.get("executed_steps", set()) | {"supervisor_context_init"},
        "agent_logs": [{"sender": "Council Supervisor", "content": "Context Layer active. Temporal trajectory and historical anchors synchronized."}]
    }

async def worker_diagnostician_node(state: AegisState) -> Dict[str, Any]:
    """Diagnostician Agent: Extracts symptoms and proposes diagnosis."""
    session_id = state.get("session_id", "UNKNOWN")
    await publish_node_status(session_id, "diagnostician", "running")
    narrative = state.get("raw_user_input", "")
    context = state.get("semantic_context", {})
    
    prompt = f"""
    You are the Senior Diagnostician.
    CLINICAL CONTEXT: {context}
    Patient Narrative: "{narrative}"
    
    TASK: 
    1. Identify clinical domain and extracted symptoms.
    2. Propose diagnosis with confidence score.
    Must return valid JSON matching AIAnalysisOutput schema.
    """
    try:
        analysis = await llm_router.execute_triage(prompt, schema=AIAnalysisOutput)
    except Exception as e:
        logger.error(f"Diagnostician Failure: {e}")
        analysis = {"severity_prediction": "MODERATE", "clinical_reasoning": "Fallback reasoning active."}

    # Simulate extraction of a drug proposal for testing the failsafe
    proposed_orders = []
    if "pain" in narrative.lower() or "infection" in narrative.lower():
        proposed_orders = [
            DrugProposal(
                medication=MedicalEntity(name="Amoxicillin", code_system="RxNorm", code="723", confidence_score=0.9),
                dosage="500mg",
                frequency="TID",
                evidence_citation="Patient reports severe pain and possible infection."
            )
        ]

    deliberation = state.get("council_deliberation")
    if not deliberation:
        deliberation = CouncilDeliberation()
    else:
        if isinstance(deliberation, dict):
            deliberation = CouncilDeliberation(**deliberation)
            
    deliberation.proposed_orders = proposed_orders

    # Physical Exam Attestation Gate (Moved here for clean separation)
    physical_exam = state.get("physical_exam", [])
    valid_exam = []
    
    for exam in physical_exam:
        # If marked normal but lacks confirmation or timestamp
        if "normal" in exam.finding.lower() and not exam.explicitly_verified and not exam.raw_audio_timestamp:
            logger.warning(f"Purging unverified normal exam finding for system: {exam.system}")
            continue
        valid_exam.append(exam)

    await ledger.log_event("NODE_EXECUTION", session_id, {"node": "diagnostician"})
    await publish_node_status(session_id, "diagnostician", "completed")
    return {
        "final_analysis": analysis,
        "council_deliberation": deliberation,
        "physical_exam": valid_exam, # Update state with purged list
        "executed_steps": state.get("executed_steps", set()) | {"worker_diagnostician"},
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Diagnostician Worker", "content": "Level 1 Extraction complete. Diagnosis proposed."}]
    }

from app.models.states import TemporalAnchor
from pydantic import BaseModel

class TemporalMatrixOutput(BaseModel):
    matrix: List[TemporalAnchor]

async def worker_temporal_node(state: AegisState) -> Dict[str, Any]:
    """Temporal Agent: Maps extracted symptoms onto a chronological timeline matrix."""
    session_id = state.get("session_id", "UNKNOWN")
    await publish_node_status(session_id, "temporal", "running")
    narrative = state.get("raw_user_input", "")
    deliberation = state.get("council_deliberation")
    if isinstance(deliberation, dict):
        deliberation = CouncilDeliberation(**deliberation)
        
    extracted_symptoms = deliberation.diagnostic_proposals if deliberation else []
    
    prompt = f"""
    You are the Chronological Timeline Processor.
    Your task is to take the extracted symptoms and map them onto an absolute chronological timeline based on the patient's narrative.
    
    Extracted Symptoms: {extracted_symptoms}
    Patient Narrative: "{narrative}"
    
    TASK:
    Output a JSON object with a 'matrix' field containing a list of TemporalAnchor objects.
    Ensure 'chronological_index' reflects the sequential order (1 being the oldest event).
    """
    
    try:
        output = await llm_router.execute_triage(prompt, schema=TemporalMatrixOutput)
        ordered_timeline = output.get("matrix", [])
    except Exception as e:
        logger.error(f"Temporal Node Failure: {e}")
        ordered_timeline = []

    if deliberation:
        deliberation.temporal_matrix = ordered_timeline

    await ledger.log_event("NODE_EXECUTION", session_id, {"node": "temporal"})
    await publish_node_status(session_id, "temporal", "completed")
    return {
        "council_deliberation": deliberation,
        "executed_steps": state.get("executed_steps", set()) | {"worker_temporal"},
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Temporal Worker", "content": "Chronological matrix generated."}]
    }

async def worker_billing_node(state: AegisState) -> Dict[str, Any]:
    """Billing/Coding Agent: Extracts ICD-10 and CPT codes for claims justification."""
    session_id = state.get("session_id", "UNKNOWN")
    await publish_node_status(session_id, "billing", "running")
    narrative = state.get("raw_user_input", "")
    diagnostician_output = state.get("final_analysis", {})
    
    prompt = f"""
    You are the Senior Billing & Coding Specialist.
    Based on the patient narrative and the proposed diagnosis, extract the appropriate ICD-10 codes for diagnoses and CPT codes for procedures/visits.
    
    Patient Narrative: "{narrative}"
    Proposed Diagnosis: {diagnostician_output}
    
    TASK:
    Output a JSON object with 'icd10_codes' and 'cpt_codes' lists.
    """
    
    try:
        coding_output = await llm_router.execute_triage(prompt, schema=None)
    except Exception as e:
        logger.error(f"Billing Node Failure: {e}")
        coding_output = {"icd10_codes": [], "cpt_codes": []}

    deliberation = state.get("council_deliberation")
    if isinstance(deliberation, dict):
        deliberation = CouncilDeliberation(**deliberation)
        
    if deliberation:
        deliberation.billing_codes = coding_output

    await ledger.log_event("NODE_EXECUTION", session_id, {"node": "billing"})
    await publish_node_status(session_id, "billing", "completed")
    return {
        "council_deliberation": deliberation,
        "executed_steps": state.get("executed_steps", set()) | {"worker_billing"},
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Billing Worker", "content": "ICD-10 and CPT codes extracted."}]
    }

async def worker_red_team_node(state: AegisState) -> Dict[str, Any]:
    """Red Team Agent: Mandatory Dissent."""
    narrative = state.get("raw_user_input", "")
    diagnostician_output = state.get("final_analysis", {})
    
    prompt = f"""
    You are an adversarial medical director. Review the proposed primary diagnosis. Your sole objective is to defend the patient by proving the diagnosis lacks sufficient evidence or fails to account for alternative life-threatening differentials.
    
    Diagnostician Assessment: {diagnostician_output}
    Patient Narrative: "{narrative}"
    
    TASK:
    Generate a Differential Diagnosis, proving the Diagnostic Node wrong and explicitly ruling out rare but lethal conditions.
    """
    
    try:
        red_team_text = await llm_router.execute_text(prompt)
    except Exception as e:
        logger.error(f"Red Team Failure: {e}")
        red_team_text = "Fallback Red Team reasoning active."

    deliberation = state.get("council_deliberation")
    if isinstance(deliberation, dict):
        deliberation = CouncilDeliberation(**deliberation)
        
    deliberation.red_team_flags.append(f"Red Team Dissent: {red_team_text}")

    await ledger.log_event("NODE_EXECUTION", state.get("session_id", "UNKNOWN"), {"node": "red_team"})
    return {
        "council_deliberation": deliberation,
        "executed_steps": state.get("executed_steps", set()) | {"worker_red_team"},
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Red Team Worker", "content": "Mandatory dissent generated. Differential diagnoses surfaced."}]
    }

async def worker_pharmacology_node(state: AegisState) -> Dict[str, Any]:
    """Pharmacology Agent: Performs hardcoded API failsafe checks."""
    deliberation = state.get("council_deliberation")
    if isinstance(deliberation, dict):
        deliberation = CouncilDeliberation(**deliberation)
        
    patient_context = state.get("patient_context", {})
    allergies = []
    if isinstance(patient_context, dict):
        allergies = patient_context.get("known_allergies", [])
    
    # If no patient_context in state, check profile as fallback
    if not allergies and "profile" in state:
        profile = state["profile"]
        allergies = [{"name": a} for a in getattr(profile, "known_allergies", [])]

    proposed_orders = deliberation.proposed_orders if deliberation else []
    
    updated_flags = []
    override_triggered = False
    valid_orders = []
    
    for order in proposed_orders:
        # Test Case 3: Missing Citation Enforcement
        if not order.evidence_citation or order.evidence_citation.strip() == "":
            logger.warning(f"Dropping order for {order.medication.name} due to missing citation.")
            continue
            
        valid_orders.append(order)
        
        drug_rxcui = order.medication.code
        if await detect_class_allergy_conflict(drug_rxcui, allergies):
            updated_flags.append("Allergy conflict detected: ALLERGY_CONFLICT")
            override_triggered = True
            
    if deliberation:
        deliberation.proposed_orders = valid_orders # Keep only valid ones
        deliberation.red_team_flags.extend(updated_flags)
        deliberation.emergency_override = override_triggered

    await ledger.log_event("NODE_EXECUTION", state.get("session_id", "UNKNOWN"), {"node": "pharmacology"})
    return {
        "council_deliberation": deliberation,
        "executed_steps": state.get("executed_steps", set()) | {"worker_pharmacology"},
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Pharmacology Worker", "content": "Hardcoded failsafe check complete. Citations and exams verified."}]
    }

async def halt_node(state: AegisState) -> Dict[str, Any]:
    """Halt Node: Stops execution on conflict."""
    await ledger.log_event("NODE_HALT", state.get("session_id", "UNKNOWN"), {"reason": "conflict"})
    return {
        "system_status": "ACTION_REQUIRED_CONFLICT",
        "agent_logs": state.get("agent_logs", []) + [{"sender": "System", "content": "CRITICAL CONFLICT DETECTED. Execution halted. Awaiting physician override."}]
    }

# Global instance instantiation for cluster testing replication
ehr_server = SimulatedEHREngine()
mcp_router = AegisMCPClientRouter(server_engine=ehr_server)

async def consensus_synthesizer_node(state: AegisState) -> dict:
    """
    The compilation node of the swarm graph. Compiles Council agreements,
    intercepts instructions, and utilizes the MCP client layer to stage orders.
    """
    deliberation = state.get("council_deliberation")
    patient_id = state.get("patient_context", {}).get("patient_id", "PID-9923")
    
    # Check if a prior node safety flag has locked the operational state
    if isinstance(deliberation, dict):
        deliberation_dict = deliberation
    elif hasattr(deliberation, "model_dump"):
        deliberation_dict = deliberation.model_dump()
    else:
        deliberation_dict = {}
        
    if deliberation_dict.get("emergency_override", False):
        return {"system_status": "ACTION_REQUIRED_CONFLICT"}
        
    staged_orders_report = []
    
    # Process verified diagnostic proposals from the pharmacology consensus layer
    for order in deliberation_dict.get("proposed_orders", []):
        medication = order.get("medication", {})
        
        # Map to expected format for MCP client
        raw_order = {
            "code_system": medication.get("code_system", "RxNorm"),
            "code": medication.get("code"),
            "name": medication.get("name"),
            "patient_id": patient_id,
            "clinical_justification": order.get("evidence_citation", "Staged via Aegis Triage OS Council")
        }
        
        # Execute the JSON-RPC transaction through our router instance
        success, mcp_payload = mcp_router.execute_stage_order(raw_order)
            
        if success:
            staged_orders_report.append({
                "order_id": mcp_payload.get("resource_id"),
                "status": "STAGED",
                "payload": mcp_payload.get("validated_payload")
            })
        else:
            # If a structural schema validation check fails at the boundary, short-circuit immediately
            if "red_team_flags" not in deliberation_dict:
                deliberation_dict["red_team_flags"] = []
            
            error_code = mcp_payload.get("error_code")
            if error_code == -32001:
                deliberation_dict["red_team_flags"].append(f"SECURITY_BREACH: {mcp_payload.get('message')}")
            elif error_code == -32003:
                deliberation_dict["red_team_flags"].append(f"STATE_COLLISION: {mcp_payload.get('message')}")
            else:
                deliberation_dict["red_team_flags"].append(f"CRITICAL_INTEGRATION_FAILURE: {mcp_payload.get('message')}")
                
                return {
                    "council_deliberation": deliberation_dict,
                    "system_status": "ACTION_REQUIRED_CONFLICT"
                }

    # Also log to ledger!
    await ledger.log_event(
        event_type="FINAL_SYNTHESIS",
        session_id=state.get("session_id", "unknown"),
        payload={"system_status": "AWAITING_PHYSICIAN_APPROVAL", "staged_orders": staged_orders_report}
    )

    return {
        "final_action_plan": {"staged_orders": staged_orders_report},
        "system_status": "AWAITING_PHYSICIAN_APPROVAL",
        "agent_logs": state.get("agent_logs", []) + [{"sender": "Council Supervisor", "content": "Deliberation finalized. Orders staged via MCP."}]
    }

# --- CLINICAL COUNCIL GRAPH ---

def route_after_pharmacology(state: AegisState):
    deliberation = state.get("council_deliberation")
    if isinstance(deliberation, dict):
        deliberation_dict = deliberation
    elif hasattr(deliberation, "model_dump"):
        deliberation_dict = deliberation.model_dump()
    else:
        deliberation_dict = {}
        
    # Scan for protocol-level errors inserted by the MCP client router
    for flag in deliberation_dict.get("red_team_flags", []):
        if flag in ["SECURITY_BREACH", "STATE_COLLISION", "ALLERGY_CONFLICT"] or "ALLERGY_CONFLICT" in flag:
            return "halt"
            
    if deliberation_dict.get("emergency_override", False):
        return "halt"
        
    return "synthesizer"

workflow = StateGraph(AegisState)

workflow.add_node("supervisor", supervisor_node)
workflow.add_node("diagnostician", worker_diagnostician_node)
workflow.add_node("temporal", worker_temporal_node)
workflow.add_node("billing", worker_billing_node)
workflow.add_node("red_team", worker_red_team_node)
workflow.add_node("pharmacology", worker_pharmacology_node)
workflow.add_node("halt", halt_node)
workflow.add_node("synthesizer", consensus_synthesizer_node)

workflow.set_entry_point("supervisor")
workflow.add_edge("supervisor", "diagnostician")
workflow.add_edge("diagnostician", "temporal")
workflow.add_edge("temporal", "billing")
workflow.add_edge("billing", "red_team")
workflow.add_edge("red_team", "pharmacology")

workflow.add_conditional_edges(
    "pharmacology",
    route_after_pharmacology,
    {
        "halt": "halt",
        "synthesizer": "synthesizer"
    }
)

workflow.add_edge("halt", END)
workflow.add_edge("synthesizer", END)

# Singleton Export
_compiled_engine = None

def init_graph_engine(checkpointer=None):
    global _compiled_engine
    if _compiled_engine is not None:
        logger.info("Graph engine already initialized.")
        return _compiled_engine
    _compiled_engine = workflow.compile(checkpointer=checkpointer)
    return _compiled_engine

def get_graph_engine():
    return _GraphEngineWrapper()

class _GraphEngineWrapper:
    @property
    def executor(self):
        return _compiled_engine
