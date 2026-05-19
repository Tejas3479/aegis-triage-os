from enum import Enum
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from uuid import UUID

class CareLevel(str, Enum):
    """
    Categorization of patient care priority.
    """
    HOME_CARE = "HOME_CARE"
    CLINIC_VISIT = "CLINIC_VISIT"
    EMERGENCY_ROOM = "EMERGENCY_ROOM"

class SymptomSeverity(str, Enum):
    """
    Clinical severity levels for symptom analysis.
    """
    MILD = "MILD"
    MODERATE = "MODERATE"
    CRITICAL = "CRITICAL"

class PatientVitals(BaseModel):
    """
    Validated patient vital signs monitoring.
    """
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    spO2: Optional[int] = Field(None, ge=50, le=100)
    temperature: Optional[float] = Field(None, ge=90.0, le=110.0)

class PatientProfile(BaseModel):
    """
    Consolidated medical profile and demographic data.
    """
    age: int = Field(..., ge=0, le=125)
    gender: Literal['M', 'F', 'O']
    medical_history: List[str] = Field(default_factory=list)
    known_allergies: List[str] = Field(default_factory=list)
    current_meds: List[str] = Field(default_factory=list)
    vitals: Optional[PatientVitals] = None
    latitude: float
    longitude: float

class MentalHealthAssessment(BaseModel):
    """
    Clinical psychometric assessment results (PHQ-9 and GAD-7).
    """
    phq9_score: int = Field(..., ge=0, le=27)
    gad7_score: int = Field(..., ge=0, le=21)
    clinical_depression_risk: bool
    self_harm_flag: bool

class ModelEvaluationAudit(BaseModel):
    """
    Inference telemetry and audit metrics.
    """
    model_name: str
    inference_latency_ms: float
    confidence_score: float

class AIAnalysisOutput(BaseModel):
    """
    Deterministic AI-driven clinical analysis result.
    """
    extracted_symptoms: List[str]
    severity_prediction: SymptomSeverity
    care_level: CareLevel
    clinical_reasoning: str = Field(..., description="Step-by-step logic detailing why this care level fits clinical inputs.")
    guidance_notes: str = Field(..., description="Safe pre-hospitalization advice.")
    emergency_detected: bool
    risk_score: int = Field(0, ge=0, le=100) # 0-100 priority score
    mental_health_flag: bool = False
    detected_language: str

class PatientBase(BaseModel):
    anon_hash: str
    geo_latitude: float
    geo_longitude: float

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
class TriageSessionBase(BaseModel):
    patient_id: UUID
    care_level: Optional[CareLevel] = None
    risk_score: int = 0
    status: str = "ACTIVE"
    mental_health_flag: bool = False
    webrtc_room_url: Optional[str] = None

class TriageSession(TriageSessionBase):
    id: UUID
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatTriageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: str = Field(..., min_length=1)


# --- PRECISION CLINICAL INTEROPERABILITY (ICE) SCHEMAS ---

class ClinicalGuidelineReference(BaseModel):
    issuing_body: str = Field(..., description="The medical governing organization, e.g., AHA, ADA, KDIGO.")
    guideline_id: str = Field(..., description="Specific reference identifier or section notation.")
    recommendation_tier: str = Field(..., description="The official level of evidence classification, e.g., Class I, Level A.")

class DrugDiseaseInteraction(BaseModel):
    medication_name: str = Field(..., description="The specific active pharmaceutical ingredient or molecule identified.")
    contraindicated_condition: str = Field(..., description="The diagnosed pathology or physiological variable causing conflict.")
    severity_level: str = Field(..., description="Risk tier: MINOR, MODERATE, or ABSOLUTE_CONTRAINDICATION.")
    pathophysiological_mechanism: str = Field(..., description="Detailed explanation of the dangerous biological pathway or drug reaction.")

class PrescriptiveActionOrder(BaseModel):
    action_type: str = Field(..., description="The recommended action: ADJUST_DOSAGE, SUSPEND_MEDICATION, or ORDER_URGENT_LABS.")
    target_chemical: str = Field(..., description="The specific medication name or laboratory marker target.")
    suggested_modification: str = Field(..., description="Precise adjustment directive, e.g., 'Reduce Metformin to 500mg daily'.")
    evidence_justification: str = Field(..., description="Traceable rationale based on patient data trends and guidelines.")

class AuditableCareEncounter(BaseModel):
    clinical_narrative_summary: str = Field(..., description="Synthesized, structured account of patient status and complaints.")
    biomarker_variance_analysis: str = Field(..., description="Detailed explanation of physiological deviations from baselines.")
    active_drug_risks: List[DrugDiseaseInteraction] = Field(..., description="Identified drug-drug or drug-disease interactions.")
    suggested_interventions: List[PrescriptiveActionOrder] = Field(..., description="Actionable care recommendations prepared for review.")
    governing_pathway_references: List[ClinicalGuidelineReference] = Field(..., description="Traceable medical guidelines supporting the decisions.")

class TriageApiResponse(BaseModel):
    session_id: str
    care_level: str
    guidance_notes: str
    extracted_symptoms: List[str] = Field(default_factory=list)
    telemedicine_url: Optional[str] = None
    status: str = "processed"
    transcription: Optional[str] = None
    risk_score: int = 0
    # ICE Expansion
    auditable_encounter: Optional[AuditableCareEncounter] = None
