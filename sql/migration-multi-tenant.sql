-- =====================================================
-- MULTI-TENANT MIGRATION
-- Adds users, authentication, and tenant isolation
-- Date: 2025-12-22
-- =====================================================

-- =====================================================
-- 1. USERS TABLE (Authentication + Roles + Subscription)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'artist', -- 'admin' | 'artist'

  -- Subscription & Quota
  subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'unlimited'
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

  -- Constraints
  CONSTRAINT check_role CHECK (role IN ('admin', 'artist')),
  CONSTRAINT check_subscription_plan CHECK (subscription_plan IN ('free', 'pro', 'unlimited'))
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

COMMENT ON TABLE users IS 'Users with authentication and role-based access control';
COMMENT ON COLUMN users.role IS 'User role: admin (super admin) or artist (regular user)';
COMMENT ON COLUMN users.subscription_plan IS 'Subscription tier: free (1K), pro (10K), unlimited (admin)';
COMMENT ON COLUMN users.monthly_quota IS 'Maximum emails per month based on plan';
COMMENT ON COLUMN users.emails_sent_this_month IS 'Emails sent in current billing cycle';

-- =====================================================
-- 2. USER SETTINGS TABLE (Tenant-specific config)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Email Provider Credentials (TODO: Encrypt in Phase 2)
  brevo_api_key TEXT,
  soundcloud_user_id VARCHAR(100),
  sender_email VARCHAR(255),
  sender_name VARCHAR(255),

  -- Email Customization
  default_greeting TEXT DEFAULT 'Hey mate,',
  default_signature TEXT DEFAULT 'Much love,',

  -- Feature Flags
  auto_send_enabled BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_settings UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'Tenant-specific configuration (API keys, email defaults, feature flags)';
COMMENT ON COLUMN user_settings.brevo_api_key IS 'Brevo API key (should be encrypted)';

-- =====================================================
-- 3. SESSIONS TABLE (NextAuth.js sessions)
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

COMMENT ON TABLE sessions IS 'NextAuth.js session storage';

-- =====================================================
-- 4. ADD user_id TO EXISTING TABLES (Multi-tenancy)
-- =====================================================

-- 4.1 Contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- 4.2 Email Templates
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- 4.3 Email Campaigns
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);

-- 4.4 Consent History
ALTER TABLE consent_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_consent_history_user_id ON consent_history(user_id);

-- 4.5 Email Logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- 4.6 Email Events
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);

-- 4.7 SoundCloud Tracks
ALTER TABLE soundcloud_tracks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_soundcloud_tracks_user_id ON soundcloud_tracks(user_id);

-- 4.8 Execution Logs
ALTER TABLE execution_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);

-- =====================================================
-- 5. UPDATE VIEWS FOR MULTI-TENANCY
-- =====================================================

-- Drop old views if they exist
DROP VIEW IF EXISTS execution_history;
DROP VIEW IF EXISTS subscription_stats;

-- New execution_history (requires user_id filter in queries)
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
-- 6. ADMIN HELPER VIEWS
-- =====================================================

-- Admin dashboard: User stats
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  u.id,
  u.email,
  u.name,
  u.role,
  u.subscription_plan,
  u.monthly_quota,
  u.emails_sent_this_month,
  u.quota_reset_at,
  u.active,
  u.created_at,
  u.last_login_at,
  (SELECT COUNT(*) FROM contacts WHERE user_id = u.id AND subscribed = true) as active_contacts,
  (SELECT COUNT(*) FROM email_campaigns WHERE user_id = u.id) as total_campaigns,
  (SELECT COUNT(*) FROM email_campaigns WHERE user_id = u.id AND status = 'draft') as draft_campaigns
FROM users u
WHERE u.role = 'artist'
ORDER BY u.created_at DESC;

COMMENT ON VIEW admin_user_stats IS 'Admin dashboard: Artist statistics (contacts, campaigns, quota usage)';

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_settings table
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Verify new tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'user_settings', 'sessions');

-- Verify user_id columns added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'user_id';

-- Verify indexes created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'users';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Next steps:
-- 1. Run this migration: psql $POSTGRES_URL -f sql/migration-multi-tenant.sql
-- 2. Verify tables: \d users, \d user_settings, \d sessions
-- 3. Create admin user manually (see scripts/migrate-to-multi-tenant.ts)
-- 4. Run data migration script to move existing data to first artist
