import { 
  TriageResponse, 
  DoctorQueueItem, 
  OutbreakCluster, 
  HDBSCANResponse, 
  MentalHealthResponse,
  AuthResponse,
  RegisterResponse
} from "@/types";

export type { 
  TriageResponse, 
  DoctorQueueItem, 
  OutbreakCluster, 
  HDBSCANResponse, 
  MentalHealthResponse,
  AuthResponse,
  RegisterResponse
};

import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const COOKIE_OPTS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function setAuthCookies(accessToken: string, role: string, expiresDays: number) {
  Cookies.set('aegis_token', accessToken, { ...COOKIE_OPTS, expires: expiresDays });
  Cookies.set('aegis_role', role, { ...COOKIE_OPTS, expires: expiresDays });
}

function sessionFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return typeof payload.session_id === 'string' ? payload.session_id : null;
  } catch {
    return null;
  }
}

/** Issues or refreshes a session-scoped PATIENT token before clinical API calls. */
export async function ensurePatientToken(sessionId: string): Promise<void> {
  const existingRole = Cookies.get('aegis_role');
  const token = Cookies.get('aegis_token');

  if (token && existingRole === 'PATIENT' && sessionFromToken(token) === sessionId) {
    return;
  }

  const authRes = await fetch(`${API_BASE}/api/v1/auth/anonymous`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({ detail: authRes.statusText }));
    throw new ApiError(authRes.status, err.detail || 'Anonymous authentication failed.');
  }

  const authData: AuthResponse = await authRes.json();
  if (authData.access_token) {
    setAuthCookies(authData.access_token, authData.role || 'PATIENT', 1 / 12);
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, timeout = 10000): Promise<T> {
  const token = Cookies.get('aegis_token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(response.status, errorData.detail || 'Network response failure.');
    }

    return await response.json() as T;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function postAudioTriage(audioBlob: Blob, sessionId: string): Promise<TriageResponse> {
  await ensurePatientToken(sessionId);

  const formData = new FormData();
  formData.append('file', audioBlob, 'triage_audio.wav');
  formData.append('session_id', sessionId);

  return apiFetch<TriageResponse>('/api/v1/triage/voice', {
    method: 'POST',
    body: formData
  }, 30000);
}

export async function postChatTriage(message: string, sessionId: string): Promise<TriageResponse> {
  await ensurePatientToken(sessionId);

  return apiFetch<TriageResponse>('/api/v1/triage/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId })
  }, 30000);
}

export async function fetchDoctorQueue(): Promise<DoctorQueueItem[]> {
  return apiFetch<DoctorQueueItem[]>('/api/v1/doctor/queue', { cache: 'no-store' });
}

export async function fetchOutbreakClusters(): Promise<OutbreakCluster[]> {
  const rawData = await apiFetch<HDBSCANResponse>('/api/v1/public-health/outbreaks', { cache: 'no-store' });
  const clusters = rawData.clusters || [];
  
  return clusters.map((c: { cluster_id: number; density_count: number; center_latitude: number; center_longitude: number }) => {
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
}

export async function downloadEHRPdf(sessionId: string): Promise<void> {
  const token = Cookies.get('aegis_token');
  const res = await fetch(`${API_BASE}/api/v1/reports/download/${sessionId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

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

export async function submitMentalAssessment(sessionId: string, phq9Score: number): Promise<MentalHealthResponse> {
  await ensurePatientToken(sessionId);

  const payload = {
    phq9_score: phq9Score,
    gad7_score: 0,
    clinical_depression_risk: phq9Score >= 10,
    self_harm_flag: false
  };

  return apiFetch<MentalHealthResponse>(`/api/v1/mental/assessment/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function loginDoctor(username: string, pin: string): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', pin);
  
  const data = await apiFetch<AuthResponse>('/api/v1/auth/login', { 
    method: 'POST', 
    body: formData 
  });

  setAuthCookies(data.access_token, data.role, 1);
  return data;
}

export async function registerDoctor(username: string, pin: string, hospitalCode: string): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: pin,
      hospital_code: hospitalCode
    })
  });
}

export async function syncWearableData(sessionId: string, heartRate: number, spO2: number): Promise<unknown> {
  await ensurePatientToken(sessionId);

  return apiFetch('/api/v1/wearables/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      heart_rate: heartRate,
      spO2: spO2
    })
  });
}
