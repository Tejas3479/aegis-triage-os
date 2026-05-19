from typing import List, Dict, Optional, Annotated, Set, Any, Literal
from typing_extensions import TypedDict
import operator
from pydantic import BaseModel, Field
from app.models.schemas import PatientProfile, AIAnalysisOutput, MentalHealthAssessment, AuditableCareEncounter

class AgentMessage(TypedDict):
    sender: str
    content: str

# --- Zero-Fault Blueprint Models ---
class MedicalEntity(BaseModel):
    name: str
    code_system: Literal["SNOMED-CT", "RxNorm", "ICD-10"]
    code: str  # Mandatory mapping identifier
    confidence_score: float

class DrugProposal(BaseModel):
    medication: MedicalEntity
    dosage: str
    frequency: str
    evidence_citation: str = Field(description="Exact snippet from transcript justifying this order")

class PhysicalExamAttestation(BaseModel):
    system: str
    finding: str
    explicitly_verified: bool = False
    raw_audio_timestamp: Optional[str]

class TemporalAnchor(BaseModel):
    symptom_code: str  # Foreign key mapping back to MedicalEntity.code
    onset_relative: str = Field(description="Patient's stated timeframe, e.g., '3 weeks ago', 'since childhood'")
    progression: Literal["acute", "chronic", "worsening", "improving", "stable", "intermittent"]
    chronological_index: int = Field(description="The absolute sequential order of appearance in the patient's medical history")
    associated_triggers: List[str] = []

class CouncilDeliberation(BaseModel):
    diagnostic_proposals: List[MedicalEntity] = []
    proposed_orders: List[DrugProposal] = []
    pharmacology_checks: List[dict] = []
    temporal_matrix: List[TemporalAnchor] = []  # The ordered timeline array
    billing_codes: Dict[str, Any] = {}  # ICD-10 and CPT codes
    red_team_flags: List[str] = []
    emergency_override: bool = False

class AegisState(TypedDict):
    # --- Identifiers ---
    encounter_id: str
    session_id: str
    
    # --- Context & History ---
    patient_context: dict  # Contains structural arrays for known_allergies and current_meds
    profile: PatientProfile
    chat_history: Annotated[List[Dict], operator.add]
    agent_logs: Annotated[List[AgentMessage], operator.add]
    
    # --- Inputs ---
    raw_user_input: str
    sanitized_english_input: str
    target_iso_code: str
    raw_transcript: Optional[str]
    
    # --- State Machine ---
    next_step: str
    executed_steps: Annotated[Set[str], operator.or_]
    system_status: Literal["PROCESSING", "AWAITING_PHYSICIAN_APPROVAL", "ACTION_REQUIRED_CONFLICT"]
    
    # --- Data Models ---
    extracted_symptoms: List[MedicalEntity]
    physical_exam: List[PhysicalExamAttestation]
    council_deliberation: CouncilDeliberation
    final_action_plan: Optional[dict]
    
    # --- Existing App Fields (Kept for compatibility) ---
    triage_raw_output: Optional[Dict]
    mental_health_raw_output: Optional[Dict]
    outbreak_raw_output: Optional[Dict]
    pharmaco_output: Optional[Dict]
    resource_allocation: Optional[Dict]
    
    # High-Growth Intelligence Layer Outputs
    peer_review_output: Optional[Dict]
    order_drafts: Optional[List[str]]
    patient_narrative_output: Optional[str]
    clinical_scribe_output: Optional[Dict]
    
    # Interoperable Care-Continuity Engine (ICE) Layer
    biomarker_variance: Optional[str]
    auditable_encounter: Optional[AuditableCareEncounter]
    
    # Enterprise Context Layer
    semantic_context: Optional[Dict[str, Any]]
    
    # Production Outcome Schemas
    final_analysis: Optional[AIAnalysisOutput]
    emergency_override: bool
    telemedicine_routing_required: bool
    telemedicine_url: str
