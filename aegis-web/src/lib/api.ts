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
  const res = await fetch(`${API_BASE}/api/v1/doctor/dashboard/queue`, { 
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new ApiError(res.status, 'Failed to resolve priority queue.');
  return await res.json() as DoctorQueueItem[];
}
