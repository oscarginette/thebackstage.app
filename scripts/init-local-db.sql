-- =====================================================
-- BACKSTAGE LOCAL DATABASE INITIALIZATION
-- Complete schema setup for local development
-- Date: 2025-12-22
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. USERS TABLE (Authentication + Roles)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'artist',

  -- New fields for settings
  soundcloud_id VARCHAR(255),
  spotify_id VARCHAR(255),

  -- Subscription & Quota
  subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free',
  monthly_quota INTEGER NOT NULL DEFAULT 1000,
  emails_sent_this_month INTEGER NOT NULL DEFAULT 0,
  quota_reset_at TIMESTAMP DEFAULT (DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'),

  -- Account Status
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  CONSTRAINT check_role CHECK (role IN ('admin', 'artist')),
  CONSTRAINT check_subscription_plan CHECK (subscription_plan IN ('free', 'pro', 'unlimited'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_soundcloud_id ON users(soundcloud_id);
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);

-- =====================================================
-- 2. SESSIONS TABLE (NextAuth)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- =====================================================
-- 3. SOUNDCLOUD TRACKS
-- =====================================================
CREATE TABLE IF NOT EXISTS soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  track_id VARCHAR(500) NOT NULL,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  cover_image VARCHAR(1000),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_soundcloud_tracks_track_id ON soundcloud_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_soundcloud_tracks_user_id ON soundcloud_tracks(user_id);

-- =====================================================
-- 4. CONTACTS
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  source VARCHAR(100) DEFAULT 'hypedit',
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE,
  metadata JSONB,
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_subscribed ON contacts(subscribed);
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribe_token ON contacts(unsubscribe_token);

-- Trigger para auto-generar unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_unsubscribe_token ON contacts;
CREATE TRIGGER set_unsubscribe_token
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION generate_unsubscribe_token();

-- =====================================================
-- 5. EMAIL TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- =====================================================
-- 6. EMAIL CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
  track_id VARCHAR(500),
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  recipients_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_status CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- =====================================================
-- 7. EMAIL LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
  track_id VARCHAR(500),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resend_email_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- =====================================================
-- 8. EMAIL EVENTS (Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email_log_id INTEGER REFERENCES email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- =====================================================
-- 9. CONSENT HISTORY (GDPR)
-- =====================================================
CREATE TABLE IF NOT EXISTS consent_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_consent_history_user_id ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_contact_id ON consent_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_timestamp ON consent_history(timestamp DESC);

-- =====================================================
-- 10. EXECUTION LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  new_tracks INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  track_id VARCHAR(500),
  track_title VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_executed_at ON execution_logs(executed_at DESC);

-- =====================================================
-- 11. APP CONFIG
-- =====================================================
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. VIEWS
-- =====================================================
CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
  COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days
FROM contacts
GROUP BY user_id;

CREATE OR REPLACE VIEW execution_history AS
SELECT
  st.user_id,
  st.track_id,
  st.title,
  st.url,
  st.published_at,
  el.executed_at,
  el.emails_sent,
  el.duration_ms,
  st.cover_image,
  st.description
FROM soundcloud_tracks st
LEFT JOIN execution_logs el ON st.track_id = el.track_id AND st.user_id = el.user_id
WHERE el.new_tracks > 0
ORDER BY el.executed_at DESC
LIMIT 50;

-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Create a test user (password is "password123" hashed with bcrypt)
-- You'll need to update this with a real hash from your app
INSERT INTO users (email, password_hash, name, role, subscription_plan)
VALUES (
  'test@example.com',
  '$2a$10$rOz6vqZ9vJ3kZ8Z3kZ8Z3u',  -- This is a placeholder, replace with real hash
  'Test User',
  'artist',
  'free'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
