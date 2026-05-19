export interface AgentLog {
  sender: string;
  content: string;
}

export interface AIAnalysisOutput {
  extracted_symptoms: string[];
  severity_prediction: 'MILD' | 'MODERATE' | 'CRITICAL';
  care_level: 'HOME_CARE' | 'CLINIC_VISIT' | 'EMERGENCY_ROOM';
  clinical_reasoning: string;
  guidance_notes: string;
  emergency_detected: boolean;
  risk_score: number;
  mental_health_flag?: boolean;
  detected_language: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface TriageResponse {
  session_id: string;
  final_analysis: AIAnalysisOutput;
  telemedicine_url?: string;
  telemedicine_routing_required: boolean;
  agent_logs: AgentLog[];
  clinical_scribe_output?: SOAPNote;

  auditable_encounter?: {
    clinical_narrative_summary: string;
    biomarker_variance_analysis: string;
    active_drug_risks: {
      medication_name: string;
      contraindicated_condition: string;
      severity_level: string;
      pathophysiological_mechanism: string;
    }[];
    suggested_interventions: {
      action_type: string;
      target_chemical: string;
      suggested_modification: string;
      evidence_justification: string;
    }[];
    governing_pathway_references: {
      issuing_body: string;
      guideline_id: string;
      recommendation_tier: string;
    }[];
  };
}

export interface DoctorQueueItem {
  id: string;
  patient_id: string;
  care_level: string;
  risk_score: number;
  status: string;
  updated_at: string;
  // ICE Enrichment
  biomarker_variance?: string;
  has_critical_risks?: boolean;
}

export interface HDBSCANResponse {
  status: string;
  cluster_count: number;
  clusters: Array<{
    cluster_id: number;
    center_latitude: number;
    center_longitude: number;
    density_count: number;
    radius_km_approx: number;
  }>;
}

export interface OutbreakCluster {
  cluster_id: number;
  disease_pattern: string;
  case_count: number;
  center_latitude: number;
  center_longitude: number;
  risk_level: 'CRITICAL' | 'WARNING' | 'MONITOR';
}

export interface MentalHealthResponse {
  status: string;
  session_id?: string;
  message?: string;
  clinical_depression_risk?: boolean;
  self_harm_flag?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
}

export interface ConsentResponse {
  status: string;
  session_id: string;
  patient_id?: string;
  consent_timestamp?: string;
  has_consent?: boolean;
}
