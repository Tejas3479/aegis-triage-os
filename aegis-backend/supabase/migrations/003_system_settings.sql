CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert defaults
INSERT INTO system_settings (key, value) VALUES
  ('clinical', '{"risk_threshold": 70, "auto_fallback": true, "pii_redaction": true, "session_ttl": true}');
