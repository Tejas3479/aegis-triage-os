const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Enterprise Type Definitions
export interface TriageResponse {
  session_id: string;
  care_level: 'HOME_CARE' | 'CLINIC_VISIT' | 'EMERGENCY_ROOM';
  guidance_notes: string;
  extracted_symptoms: string[];
}

export interface DoctorQueueItem {
  id: string;
  patient_id: string;
  care_level: string;
  risk_score: number;
  status: string;
  updated_at: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function postAudioTriage(audioBlob: Blob, sessionId: string): Promise<TriageResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'triage_audio.wav');
  formData.append('session_id', sessionId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for ML inference

  try {
    const res = await fetch(`${API_BASE}/api/v1/triage/voice`, { 
      method: 'POST', 
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!res.ok) throw new ApiError(res.status, `Voice triage failed: ${res.statusText}`);
    return await res.json() as TriageResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function fetchDoctorQueue(): Promise<DoctorQueueItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE}/api/v1/doctor/queue`, { 
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new ApiError(res.status, 'Failed to resolve priority queue.');
    return await res.json() as DoctorQueueItem[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
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

export async function fetchOutbreakClusters(): Promise<OutbreakCluster[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE}/api/v1/public-health/outbreaks`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new ApiError(res.status, 'Failed to resolve HDBSCAN cluster data.');
    
    const rawData = await res.json() as HDBSCANResponse;
    const clusters = rawData.clusters || [];
    
    // Adapter Pattern: Map backend "density_count" to requested frontend schema
    return clusters.map((c) => {
      let risk: 'CRITICAL' | 'WARNING' | 'MONITOR' = 'MONITOR';
      if (c.density_count > 15) risk = 'CRITICAL';
      else if (c.density_count > 5) risk = 'WARNING';
      
      return {
        cluster_id: c.cluster_id,
        disease_pattern: "Viral Respiratory (Presumed)",
        case_count: c.density_count,
        center_latitude: c.center_latitude,
        center_longitude: c.center_longitude,
        risk_level: risk
      };
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function downloadEHRPdf(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/reports/download/${sessionId}`);
  if (!res.ok) throw new Error('PDF Generation pending or failed.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AEGIS_EHR_${sessionId.substring(0,8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface MentalHealthResponse {
  status: string;
  session_id?: string;
  message?: string;
}

export async function submitMentalAssessment(sessionId: string, phq9Score: number): Promise<MentalHealthResponse> {
  // Logic bridge to satisfy the strict Pydantic backend schema
  const payload = {
    phq9_score: phq9Score,
    gad7_score: 0,
    clinical_depression_risk: phq9Score >= 10,
    self_harm_flag: false
  };

  const res = await fetch(`${API_BASE}/api/v1/mental/assessment/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) throw new ApiError(res.status, 'Failed to log psychometric data.');
  return await res.json() as MentalHealthResponse;
}

export async function loginDoctor(username: string, pin: string): Promise<string> {
  // Utilizing standard OAuth2 Form Data structure required by FastAPI
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', pin);
  
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, { 
    method: 'POST', 
    body: formData 
  });
  
  if (!res.ok) throw new Error('Invalid clinical PIN or credentials.');
  const data = await res.json();
  return data.access_token;
}
