export interface TriageResponse {
  session_id: string;
  care_level: 'HOME_CARE' | 'CLINIC_VISIT' | 'EMERGENCY_ROOM';
  guidance_notes: string;
  extracted_symptoms: string[];
  telemedicine_url?: string;
  status: string;
}

export interface DoctorQueueItem {
  id: string;
  patient_id: string;
  care_level: string;
  risk_score: number;
  status: string;
  updated_at: string;
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
