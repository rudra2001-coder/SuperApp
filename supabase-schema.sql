-- SuperApp Supabase Schema
-- Run this in the Supabase SQL editor to set up your database tables

-- Templates for Data Processor
CREATE TABLE IF NOT EXISTS templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- Extracted data from Data Processor
CREATE TABLE IF NOT EXISTS extracted_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_data_user_id ON extracted_data(user_id);

-- Ping history
CREATE TABLE IF NOT EXISTS ping_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ping_history_user_id ON ping_history(user_id);

-- User preferences (theme, default ports, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
DROP POLICY IF EXISTS "Users can manage their own templates" ON templates;
CREATE POLICY "Users can manage their own templates"
  ON templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own extracted data" ON extracted_data;
CREATE POLICY "Users can manage their own extracted data"
  ON extracted_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own ping history" ON ping_history;
CREATE POLICY "Users can manage their own ping history"
  ON ping_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Data Sessions for Fill from Sample workflow (Mark 2)
-- Each row = one upload session per user
-- ============================================================
CREATE TABLE IF NOT EXISTS data_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step TEXT DEFAULT 'upload-demo',
  demo_file_name TEXT DEFAULT '',
  demo_headers JSONB DEFAULT '[]'::jsonb,
  demo_rows JSONB DEFAULT '[]'::jsonb,
  source_file_name TEXT DEFAULT '',
  source_headers JSONB DEFAULT '[]'::jsonb,
  source_rows JSONB DEFAULT '[]'::jsonb,
  col_map JSONB DEFAULT '{}'::jsonb,
  filled_data JSONB DEFAULT '[]'::jsonb,
  unique_rules JSONB DEFAULT '{"clientCode":true,"mobile":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sessions_session_id ON data_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_data_sessions_user_id ON data_sessions(user_id);

ALTER TABLE data_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own data sessions" ON data_sessions;
CREATE POLICY "Users can manage their own data sessions"
  ON data_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- HTTP request tester profiles & history
CREATE TABLE IF NOT EXISTS http_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_http_profiles_user_id ON http_profiles(user_id);

ALTER TABLE http_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own http profiles" ON http_profiles;
CREATE POLICY "Users can manage their own http profiles"
  ON http_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subdomain discovery history
CREATE TABLE IF NOT EXISTS subdomain_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subdomain_history_user_id ON subdomain_history(user_id);

ALTER TABLE subdomain_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subdomain history" ON subdomain_history;
CREATE POLICY "Users can manage their own subdomain history"
  ON subdomain_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scenario definitions
CREATE TABLE IF NOT EXISTS scenarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own scenarios" ON scenarios;
CREATE POLICY "Users can manage their own scenarios"
  ON scenarios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Network status dashboard checks (realtime-enabled)
CREATE TABLE IF NOT EXISTS network_checks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID,
  target TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('http', 'ping', 'ssl')),
  status TEXT NOT NULL CHECK (status IN ('up', 'down', 'unknown')),
  latency_ms NUMERIC,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_checks_session ON network_checks(session_id);
CREATE INDEX IF NOT EXISTS idx_network_checks_checked ON network_checks(checked_at DESC);

ALTER TABLE network_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own network checks" ON network_checks;
CREATE POLICY "Users can manage their own network checks"
  ON network_checks FOR ALL
  USING (session_id = auth.uid() OR session_id IS NULL)
  WITH CHECK (session_id = auth.uid() OR session_id IS NULL);

-- Enable realtime for network_checks
-- Run: ALTER PUBLICATION supabase_realtime ADD TABLE network_checks;
-- This is done via Supabase UI under Database > Replication

-- SSL certificates monitor
CREATE TABLE IF NOT EXISTS ssl_certificates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID,
  domain TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  days_left INTEGER,
  issuer TEXT,
  subject TEXT,
  notify_expiry BOOLEAN DEFAULT true,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ssl_certificates_session ON ssl_certificates(session_id);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_expiry ON ssl_certificates(expires_at);

ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ssl certificates" ON ssl_certificates;
CREATE POLICY "Users can manage their own ssl certificates"
  ON ssl_certificates FOR ALL
  USING (session_id = auth.uid() OR session_id IS NULL)
  WITH CHECK (session_id = auth.uid() OR session_id IS NULL);

-- Scan campaigns (subdomain discovery + port scan)
CREATE TABLE IF NOT EXISTS scan_campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID,
  target_domain TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  ports INTEGER[] DEFAULT '{}',
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_campaigns_session ON scan_campaigns(session_id);

ALTER TABLE scan_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own scan campaigns" ON scan_campaigns;
CREATE POLICY "Users can manage their own scan campaigns"
  ON scan_campaigns FOR ALL
  USING (session_id = auth.uid() OR session_id IS NULL)
  WITH CHECK (session_id = auth.uid() OR session_id IS NULL);

-- API collections (request tester collections)
CREATE TABLE IF NOT EXISTS api_collections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID,
  name TEXT NOT NULL,
  requests JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_collections_session ON api_collections(session_id);

ALTER TABLE api_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own api collections" ON api_collections;
CREATE POLICY "Users can manage their own api collections"
  ON api_collections FOR ALL
  USING (session_id = auth.uid() OR session_id IS NULL)
  WITH CHECK (session_id = auth.uid() OR session_id IS NULL);

-- User profiles (linked to auth users for preference persistence)
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable anonymous sign-ins (required for the app to work without login)
-- Run this in Supabase Auth > Settings:
-- Make sure "Allow anonymous sign-ins" is enabled
