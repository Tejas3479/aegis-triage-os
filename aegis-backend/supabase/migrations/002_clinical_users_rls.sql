-- Migration: clinical_users table + RLS policies
-- Run after initial schema or on existing deployments

CREATE TABLE IF NOT EXISTS clinical_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(128) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('DOCTOR', 'ADMIN')),
    hospital_code VARCHAR(64),
    auth_user_id UUID NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_users_username ON clinical_users(username);

ALTER TABLE clinical_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_anon_patients ON patients;
DROP POLICY IF EXISTS deny_anon_triage_sessions ON triage_sessions;
DROP POLICY IF EXISTS deny_anon_medical_audit_logs ON medical_audit_logs;
DROP POLICY IF EXISTS deny_anon_clinical_users ON clinical_users;
DROP POLICY IF EXISTS deny_anon_dpdp_consent ON dpdp_consent_logs;
DROP POLICY IF EXISTS doctor_read_triage_sessions ON triage_sessions;
DROP POLICY IF EXISTS doctor_read_patients ON patients;
DROP POLICY IF EXISTS doctor_read_audit_logs ON medical_audit_logs;
DROP POLICY IF EXISTS admin_read_outbreaks ON outbreaks;
DROP POLICY IF EXISTS clinical_users_self_read ON clinical_users;

CREATE POLICY deny_anon_patients ON patients FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_triage_sessions ON triage_sessions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_medical_audit_logs ON medical_audit_logs FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_clinical_users ON clinical_users FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_anon_dpdp_consent ON dpdp_consent_logs FOR ALL TO anon USING (false) WITH CHECK (false);

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
