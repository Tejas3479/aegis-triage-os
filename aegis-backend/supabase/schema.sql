-- Aegis Triage OS - Redesigned & Finalized Database Schema
-- Optimizations for Doctor Dashboard Prioritization and Mental Health Tracking

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Environment Reset
DROP TABLE IF EXISTS outbreaks CASCADE;
DROP TABLE IF EXISTS medication_reminders CASCADE;
DROP TABLE IF EXISTS dpdp_consent_logs CASCADE;
DROP TABLE IF EXISTS medical_audit_logs CASCADE;
DROP TABLE IF EXISTS triage_sessions CASCADE;
DROP TABLE IF EXISTS clinical_users CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- 3. Core Structural Tables
CREATE TABLE clinical_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(128) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('DOCTOR', 'ADMIN')),
    hospital_code VARCHAR(64),
    auth_user_id UUID NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinical_users_username ON clinical_users(username);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_hash VARCHAR(64) UNIQUE NOT NULL,
    geo_latitude DECIMAL(9,6) NOT NULL,
    geo_longitude DECIMAL(9,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimization: Geospatial index for faster HDBSCAN retrieval
CREATE INDEX idx_patients_coords ON patients(geo_latitude, geo_longitude);

CREATE TABLE triage_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
    care_level VARCHAR(20) CHECK (care_level IN ('HOME_CARE', 'CLINIC_VISIT', 'EMERGENCY_ROOM')),
    risk_score INT DEFAULT 0, -- CRITICAL: For Doctor Dashboard prioritization (0-10)
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'ESCALATED')),
    mental_health_flag BOOLEAN DEFAULT FALSE, -- For Hackathon Advanced Feature
    webrtc_room_url TEXT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES triage_sessions(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL,
    model_metadata JSONB NOT NULL, -- Lineage, F1-Score, Bias metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dpdp_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
    consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose_agreed TEXT NOT NULL,
    ip_address_hashed VARCHAR(64) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE medication_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    cron_schedule VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
-- 5. ENTERPRISE SECURITY: ROW-LEVEL SECURITY (RLS)
-- =======================================================

-- Enable RLS for all clinical tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpdp_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreaks ENABLE ROW LEVEL SECURITY;

-- Block direct anon API access to clinical data (backend uses service_role + app RBAC)
CREATE POLICY deny_anon_patients ON patients FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_triage_sessions ON triage_sessions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_medical_audit_logs ON medical_audit_logs FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_clinical_users ON clinical_users FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_dpdp_consent ON dpdp_consent_logs FOR ALL TO anon USING (false) WITH CHECK (false);

-- Supabase Auth clinical staff (JWT app_metadata.role) may read operational tables
CREATE POLICY doctor_read_triage_sessions ON triage_sessions FOR SELECT TO authenticated
USING (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('DOCTOR', 'ADMIN'));

CREATE POLICY doctor_read_patients ON patients FOR SELECT TO authenticated
USING (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('DOCTOR', 'ADMIN'));

CREATE POLICY doctor_read_audit_logs ON medical_audit_logs FOR SELECT TO authenticated
USING (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('DOCTOR', 'ADMIN'));

CREATE POLICY admin_read_outbreaks ON outbreaks FOR SELECT TO authenticated
USING (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'ADMIN');

CREATE POLICY clinical_users_self_read ON clinical_users FOR SELECT TO authenticated
USING (auth.uid() = auth_user_id);

-- =======================================================
-- 6. THE HACKATHON WINNING SEED 
-- 15 Patients perfectly clustered in Yelahanka (BMSIT Area)
INSERT INTO patients (id, anon_hash, geo_latitude, geo_longitude)
SELECT 
    gen_random_uuid(),
    md5(random()::text),
    13.1008 + (random() * 0.002 - 0.001), 
    77.5963 + (random() * 0.002 - 0.001)
FROM generate_series(1, 15);

-- 35 Noise patients scattered across Bengaluru
INSERT INTO patients (id, anon_hash, geo_latitude, geo_longitude)
SELECT 
    gen_random_uuid(),
    md5(random()::text),
    12.9716 + (random() * 0.1 - 0.05),
    77.5946 + (random() * 0.1 - 0.05)
FROM generate_series(1, 35);
