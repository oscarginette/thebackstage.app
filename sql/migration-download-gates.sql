-- =====================================================
-- DOWNLOAD GATES MIGRATION
-- Adds download gates system with OAuth verification
-- Date: 2025-12-22
-- =====================================================

-- =====================================================
-- 1. DOWNLOAD_GATES TABLE
-- Core gate configuration and requirements
-- =====================================================
CREATE TABLE IF NOT EXISTS download_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Gate Identity
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier (e.g., 'my-track-download')
  title VARCHAR(500) NOT NULL,
  artist_name VARCHAR(255), -- DJ/Artist name
  genre VARCHAR(100), -- Track genre (house, techno, etc.)
  description TEXT,

  -- Media Assets
  artwork_url TEXT, -- Track artwork/cover image
  soundcloud_track_id VARCHAR(255), -- SoundCloud track ID for verification
  soundcloud_track_url TEXT, -- Original SoundCloud URL
  soundcloud_user_id VARCHAR(255), -- SoundCloud artist/user ID

  -- Download File
  file_url TEXT NOT NULL, -- External CDN/storage URL (MVP: direct URL)
  file_size_mb DECIMAL(10, 2), -- File size in megabytes
  file_type VARCHAR(50), -- e.g., 'audio/wav', 'audio/mp3', 'application/zip'

  -- Gate Requirements (Feature Flags)
  require_email BOOLEAN DEFAULT true,
  require_soundcloud_repost BOOLEAN DEFAULT true,
  require_soundcloud_follow BOOLEAN DEFAULT false,
  require_spotify_connect BOOLEAN DEFAULT false,

  -- Gate Status & Limits
  active BOOLEAN DEFAULT true,
  max_downloads INTEGER, -- NULL = unlimited
  expires_at TIMESTAMP, -- NULL = no expiration

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for download_gates
CREATE INDEX IF NOT EXISTS idx_download_gates_user_id ON download_gates(user_id);
CREATE INDEX IF NOT EXISTS idx_download_gates_slug ON download_gates(slug);
CREATE INDEX IF NOT EXISTS idx_download_gates_soundcloud_track_id ON download_gates(soundcloud_track_id);
CREATE INDEX IF NOT EXISTS idx_download_gates_active ON download_gates(active);

COMMENT ON TABLE download_gates IS 'Download gates with configurable requirements (email, SoundCloud repost/follow, Spotify connect)';
COMMENT ON COLUMN download_gates.slug IS 'URL-friendly identifier for gate (must be unique)';
COMMENT ON COLUMN download_gates.artist_name IS 'DJ or artist name for display';
COMMENT ON COLUMN download_gates.genre IS 'Music genre classification (house, techno, reggaeton, etc.)';
COMMENT ON COLUMN download_gates.soundcloud_track_id IS 'SoundCloud track ID for repost/like verification';
COMMENT ON COLUMN download_gates.soundcloud_user_id IS 'SoundCloud artist/user ID for follow verification';
COMMENT ON COLUMN download_gates.file_url IS 'External file URL (CDN/storage) - MVP uses direct URLs';
COMMENT ON COLUMN download_gates.file_size_mb IS 'File size in megabytes for display to users';
COMMENT ON COLUMN download_gates.max_downloads IS 'Maximum downloads allowed (NULL = unlimited)';
COMMENT ON COLUMN download_gates.expires_at IS 'Gate expiration date (NULL = never expires)';

-- =====================================================
-- 2. DOWNLOAD_SUBMISSIONS TABLE
-- Tracks user submissions and verification status
-- =====================================================
CREATE TABLE IF NOT EXISTS download_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES download_gates(id) ON DELETE CASCADE,

  -- User Identity
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),

  -- SoundCloud OAuth Data
  soundcloud_user_id VARCHAR(255), -- SoundCloud user ID (from OAuth)
  soundcloud_username VARCHAR(255), -- SoundCloud username
  soundcloud_permalink VARCHAR(255), -- SoundCloud profile URL

  -- Spotify OAuth Data
  spotify_user_id VARCHAR(255), -- Spotify user ID (from OAuth)
  spotify_display_name VARCHAR(255), -- Spotify display name

  -- Email Verification
  email_verified BOOLEAN DEFAULT false,

  -- SoundCloud Repost Verification
  soundcloud_repost_verified BOOLEAN DEFAULT false,
  soundcloud_repost_verified_at TIMESTAMP,

  -- SoundCloud Follow Verification
  soundcloud_follow_verified BOOLEAN DEFAULT false,
  soundcloud_follow_verified_at TIMESTAMP,

  -- Spotify Connection
  spotify_connected BOOLEAN DEFAULT false,
  spotify_connected_at TIMESTAMP,

  -- Download Token (Secure, one-time use)
  download_token VARCHAR(255) UNIQUE, -- Random token for secure download access
  download_token_generated_at TIMESTAMP,
  download_token_expires_at TIMESTAMP, -- Typically 24 hours after generation

  -- Download Completion
  download_completed BOOLEAN DEFAULT false,
  download_completed_at TIMESTAMP,

  -- GDPR Consent
  consent_marketing BOOLEAN DEFAULT true, -- Consent to receive marketing emails

  -- Audit Trail
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for download_submissions
CREATE INDEX IF NOT EXISTS idx_download_submissions_gate_id ON download_submissions(gate_id);
CREATE INDEX IF NOT EXISTS idx_download_submissions_email ON download_submissions(email);
CREATE INDEX IF NOT EXISTS idx_download_submissions_download_token ON download_submissions(download_token);
CREATE INDEX IF NOT EXISTS idx_download_submissions_soundcloud_user_id ON download_submissions(soundcloud_user_id);
CREATE INDEX IF NOT EXISTS idx_download_submissions_created_at ON download_submissions(created_at);

COMMENT ON TABLE download_submissions IS 'User submissions for download gates with verification status and download tokens';
COMMENT ON COLUMN download_submissions.download_token IS 'Secure token for one-time download access (expires after 24h)';
COMMENT ON COLUMN download_submissions.consent_marketing IS 'GDPR: User consent to receive marketing emails';
COMMENT ON COLUMN download_submissions.ip_address IS 'User IP address for GDPR audit trail';

-- =====================================================
-- 3. DOWNLOAD_GATE_ANALYTICS TABLE
-- Event tracking for funnel analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS download_gate_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES download_gates(id) ON DELETE CASCADE,

  -- Event Type
  event_type VARCHAR(50) NOT NULL, -- 'view', 'submit', 'verify_repost', 'verify_follow', 'download'

  -- Session & Submission Tracking
  session_id VARCHAR(255), -- Browser session ID for funnel analysis
  submission_id UUID REFERENCES download_submissions(id) ON DELETE SET NULL,

  -- UTM & Marketing Attribution
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),

  -- Audit Trail
  ip_address VARCHAR(45),
  user_agent TEXT,
  country VARCHAR(2), -- ISO 3166-1 alpha-2 country code

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for download_gate_analytics
CREATE INDEX IF NOT EXISTS idx_download_gate_analytics_gate_id ON download_gate_analytics(gate_id);
CREATE INDEX IF NOT EXISTS idx_download_gate_analytics_event_type ON download_gate_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_download_gate_analytics_session_id ON download_gate_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_download_gate_analytics_created_at ON download_gate_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_download_gate_analytics_submission_id ON download_gate_analytics(submission_id);

COMMENT ON TABLE download_gate_analytics IS 'Event tracking for download gate funnel analysis';
COMMENT ON COLUMN download_gate_analytics.event_type IS 'Event type: view, submit, verify_repost, verify_follow, download';
COMMENT ON COLUMN download_gate_analytics.session_id IS 'Browser session ID for conversion funnel tracking';
COMMENT ON COLUMN download_gate_analytics.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)';

-- =====================================================
-- 4. OAUTH_STATES TABLE
-- Secure OAuth state management (CSRF protection)
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- OAuth CSRF Protection
  state_token VARCHAR(255) UNIQUE NOT NULL, -- Random token for OAuth state verification
  provider VARCHAR(50) NOT NULL, -- 'soundcloud' | 'spotify'

  -- Submission Context
  submission_id UUID NOT NULL REFERENCES download_submissions(id) ON DELETE CASCADE,
  gate_id UUID NOT NULL REFERENCES download_gates(id) ON DELETE CASCADE,

  -- PKCE (Proof Key for Code Exchange) for enhanced security
  code_verifier VARCHAR(255), -- PKCE code verifier (optional, for Spotify)

  -- State Lifecycle
  expires_at TIMESTAMP NOT NULL, -- Typically 15 minutes
  used BOOLEAN DEFAULT false, -- Prevents replay attacks

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for oauth_states
CREATE INDEX IF NOT EXISTS idx_oauth_states_state_token ON oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_submission_id ON oauth_states(submission_id);

COMMENT ON TABLE oauth_states IS 'OAuth state management for secure SoundCloud/Spotify authentication (CSRF + PKCE)';
COMMENT ON COLUMN oauth_states.state_token IS 'Random token for OAuth CSRF protection (verified in callback)';
COMMENT ON COLUMN oauth_states.code_verifier IS 'PKCE code verifier for Spotify OAuth (SHA-256 hashed in authorization)';
COMMENT ON COLUMN oauth_states.used IS 'Prevents OAuth state replay attacks (state can only be used once)';

-- =====================================================
-- 5. TRIGGERS FOR updated_at
-- Auto-update timestamps on record changes
-- =====================================================

-- Trigger for download_gates
DROP TRIGGER IF EXISTS update_download_gates_updated_at ON download_gates;
CREATE TRIGGER update_download_gates_updated_at
  BEFORE UPDATE ON download_gates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for download_submissions
DROP TRIGGER IF EXISTS update_download_submissions_updated_at ON download_submissions;
CREATE TRIGGER update_download_submissions_updated_at
  BEFORE UPDATE ON download_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER VIEWS
-- Pre-computed analytics for dashboard
-- =====================================================

-- Gate Stats View: Aggregate metrics per gate
CREATE OR REPLACE VIEW download_gate_stats AS
SELECT
  dg.id AS gate_id,
  dg.user_id,
  dg.slug,
  dg.title,
  dg.active,
  dg.created_at,

  -- Submission Counts
  COUNT(DISTINCT ds.id) AS total_submissions,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.email_verified = true) AS verified_emails,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.soundcloud_repost_verified = true) AS verified_reposts,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.soundcloud_follow_verified = true) AS verified_follows,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.spotify_connected = true) AS connected_spotify,
  COUNT(DISTINCT ds.id) FILTER (WHERE ds.download_completed = true) AS completed_downloads,

  -- Analytics Counts (Funnel)
  COUNT(DISTINCT dga.id) FILTER (WHERE dga.event_type = 'view') AS total_views,
  COUNT(DISTINCT dga.id) FILTER (WHERE dga.event_type = 'submit') AS total_submit_events,
  COUNT(DISTINCT dga.id) FILTER (WHERE dga.event_type = 'download') AS total_download_events,

  -- Conversion Rates (%)
  CASE
    WHEN COUNT(DISTINCT dga.id) FILTER (WHERE dga.event_type = 'view') > 0
    THEN ROUND(
      (COUNT(DISTINCT ds.id)::NUMERIC / COUNT(DISTINCT dga.id) FILTER (WHERE dga.event_type = 'view')) * 100,
      2
    )
    ELSE 0
  END AS view_to_submit_rate,

  CASE
    WHEN COUNT(DISTINCT ds.id) > 0
    THEN ROUND(
      (COUNT(DISTINCT ds.id) FILTER (WHERE ds.download_completed = true)::NUMERIC / COUNT(DISTINCT ds.id)) * 100,
      2
    )
    ELSE 0
  END AS submit_to_download_rate

FROM download_gates dg
LEFT JOIN download_submissions ds ON ds.gate_id = dg.id
LEFT JOIN download_gate_analytics dga ON dga.gate_id = dg.id
GROUP BY dg.id, dg.user_id, dg.slug, dg.title, dg.active, dg.created_at;

COMMENT ON VIEW download_gate_stats IS 'Pre-computed analytics: submissions, conversions, funnel metrics per gate';

-- =====================================================
-- 7. DATA INTEGRITY CONSTRAINTS
-- Additional business logic constraints
-- =====================================================

-- Ensure provider is valid
ALTER TABLE oauth_states ADD CONSTRAINT check_oauth_provider
  CHECK (provider IN ('soundcloud', 'spotify'));

-- Ensure event_type is valid
ALTER TABLE download_gate_analytics ADD CONSTRAINT check_event_type
  CHECK (event_type IN ('view', 'submit', 'verify_repost', 'verify_follow', 'download', 'connect_spotify'));

-- =====================================================
-- 8. VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Verify new tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'download_%';

-- Verify indexes created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('download_gates', 'download_submissions', 'download_gate_analytics', 'oauth_states');

-- Verify triggers created
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE '%download%';

-- Verify view created
-- SELECT table_name FROM information_schema.views WHERE table_name = 'download_gate_stats';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Next steps:
-- 1. Run this migration: psql $POSTGRES_URL -f sql/migration-download-gates.sql
-- 2. Verify tables: \d download_gates, \d download_submissions, \d download_gate_analytics, \d oauth_states
-- 3. Test view: SELECT * FROM download_gate_stats LIMIT 5;
-- 4. Begin implementing domain entities and repositories (Clean Architecture)
