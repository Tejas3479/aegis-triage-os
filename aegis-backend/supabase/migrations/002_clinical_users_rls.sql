-- =======================================================
-- 1. EXTENSIONS & ENVIRONMENT SETUP
-- =======================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean reset for fresh enterprise deployment
DROP TABLE IF EXISTS outbreaks CASCADE;
DROP TABLE IF EXISTS medication_reminders CASCADE;
DROP TABLE IF EXISTS dpdp_consent_logs CASCADE;
DROP TABLE IF EXISTS medical_audit_logs CASCADE;
DROP TABLE IF EXISTS triage_sessions CASCADE;
DROP TABLE IF EXISTS clinical_users CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- =======================================================
-- 2. IDENTITY & ROLE MANAGEMENT (The "Vault")
-- =======================================================

-- Maps Supabase Auth users to Clinical Roles
CREATE TABLE clinical_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Secure link to internal auth
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('DOCTOR', 'ADMIN')),
    hospital_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimization: Helper function for fast role verification in RLS
CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS TEXT AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$ LANGUAGE sql STABLE;

-- =======================================================
-- 3. CORE CLINICAL DATA STRUCTURES
-- =======================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_hash TEXT UNIQUE NOT NULL, -- PII-free identifier for the LLM
    geo_latitude DECIMAL(9,6) NOT NULL,
    geo_longitude DECIMAL(9,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for high-speed clustering (HDBSCAN/Haversine)
CREATE INDEX idx_patients_geospatial ON patients(geo_latitude, geo_longitude);

CREATE TABLE triage_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    care_level TEXT CHECK (care_level IN ('HOME_CARE', 'CLINIC_VISIT', 'EMERGENCY_ROOM')),
    risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100), -- 0-100 normalization
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'ESCALATED')),
    mental_health_flag BOOLEAN DEFAULT FALSE,
    webrtc_room_url TEXT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimization: Multi-column index for Doctor Dashboard priority sorting
CREATE INDEX idx_triage_priority_queue ON triage_sessions(status, risk_score DESC);

CREATE TABLE medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES triage_sessions(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL,
    model_metadata JSONB NOT NULL, -- Records F1/Bias metrics per inference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dpdp_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    purpose_agreed TEXT NOT NULL,
    ip_address_hashed TEXT NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE outbreaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id INT NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    predicted_pathology TEXT NOT NULL,
    density_count INT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 4. ENTERPRISE HARDENING: ROW-LEVEL SECURITY (RLS)
-- =======================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdp_consent_logs ENABLE ROW LEVEL SECURITY;

-- RULE 1: Absolute Denial for Unauthenticated/Anonymous Public
CREATE POLICY deny_anon_access ON triage_sessions FOR ALL TO anon USING (false);

-- RULE 2: Doctor/Admin Full Clinical Access
CREATE POLICY doctor_clinical_access ON triage_sessions FOR ALL TO authenticated
USING (get_my_role() IN ('DOCTOR', 'ADMIN'));

CREATE POLICY doctor_patient_view ON patients FOR SELECT TO authenticated
USING (get_my_role() IN ('DOCTOR', 'ADMIN'));

CREATE POLICY doctor_audit_view ON medical_audit_logs FOR SELECT TO authenticated
USING (get_my_role() IN ('DOCTOR', 'ADMIN'));

-- RULE 3: Patient Access (Secure Anonymous JWT Strategy)
-- Allows a patient to see ONLY their specific session via session_id claim
CREATE POLICY patient_session_access ON triage_sessions FOR SELECT TO authenticated
USING (
    (get_my_role() = 'PATIENT') 
    AND 
    (id::text = auth.jwt() ->> 'session_id')
);

-- RULE 4: Clinical User Privacy (Self-Read only)
CREATE POLICY clinical_user_self_read ON clinical_users FOR SELECT TO authenticated
USING (auth.uid() = auth_user_id);

-- =======================================================
-- 5. HACKATHON SEED DATA (BMSIT/Yelahanka Area)
-- =======================================================

-- 15 High-Density patients in Yelahanka (Simulating Outbreak)
INSERT INTO patients (anon_hash, geo_latitude, geo_longitude)
SELECT 
    md5(random()::text),
    13.1008 + (random() * 0.002 - 0.001), 
    77.5963 + (random() * 0.002 - 0.001)
FROM generate_series(1, 15);

-- 35 Noise patients across Bengaluru
INSERT INTO patients (anon_hash, geo_latitude, geo_longitude)
SELECT 
    md5(random()::text),
    12.9716 + (random() * 0.1 - 0.05),
    77.5946 + (random() * 0.1 - 0.05)
FROM generate_series(1, 35);