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

-- Enable anonymous sign-ins (required for the app to work without login)
-- Run this in Supabase Auth > Settings:
-- Make sure "Allow anonymous sign-ins" is enabled
