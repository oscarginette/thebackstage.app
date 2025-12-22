-- Migration: Email Campaigns and Drafts System
-- Description: Creates email_campaigns table for managing both drafts and sent campaigns
-- Date: 2025-12-22

-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References (nullable - campaigns can be standalone)
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  track_id VARCHAR(255), -- No FK constraint - tracks table may not exist

  -- Campaign content
  subject VARCHAR(500) NOT NULL CHECK (LENGTH(TRIM(subject)) > 0),
  html_content TEXT NOT NULL CHECK (LENGTH(TRIM(html_content)) > 0),

  -- Status and scheduling
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_sent_status CHECK (
    (status = 'sent' AND sent_at IS NOT NULL) OR
    (status = 'draft' AND sent_at IS NULL)
  ),

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for listing drafts (most common query)
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created
  ON email_campaigns(status, created_at DESC);

-- Index for scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled
  ON email_campaigns(scheduled_at)
  WHERE scheduled_at IS NOT NULL AND status = 'draft';

-- Index for sent campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_sent
  ON email_campaigns(sent_at DESC)
  WHERE status = 'sent';

-- Index for track-linked campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_track_id
  ON email_campaigns(track_id)
  WHERE track_id IS NOT NULL;

-- Index for template-linked campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_template_id
  ON email_campaigns(template_id)
  WHERE template_id IS NOT NULL;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_updated_at();

-- ============================================================================
-- VIEW: Campaign Analytics
-- ============================================================================

CREATE OR REPLACE VIEW campaign_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'draft') as total_drafts,
  COUNT(*) FILTER (WHERE status = 'sent') as total_sent,
  COUNT(*) FILTER (WHERE scheduled_at IS NOT NULL AND scheduled_at > NOW() AND status = 'draft') as scheduled_count,
  COUNT(*) FILTER (WHERE template_id IS NOT NULL) as template_based,
  COUNT(*) FILTER (WHERE track_id IS NOT NULL) as track_based,
  COUNT(*) FILTER (WHERE template_id IS NULL AND track_id IS NULL) as custom_emails,
  COUNT(*) as total_campaigns
FROM email_campaigns;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE email_campaigns IS 'Stores email campaigns and drafts - both track-based and custom standalone emails';
COMMENT ON COLUMN email_campaigns.template_id IS 'Reference to email template (null for custom emails)';
COMMENT ON COLUMN email_campaigns.track_id IS 'Reference to SoundCloud track (null for standalone emails)';
COMMENT ON COLUMN email_campaigns.status IS 'Campaign status: draft (not sent) or sent';
COMMENT ON COLUMN email_campaigns.scheduled_at IS 'Future timestamp for scheduled sending (null for immediate)';
COMMENT ON COLUMN email_campaigns.sent_at IS 'Timestamp when campaign was actually sent (null for drafts)';

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

DO $$
BEGIN
  -- Verify table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
    RAISE EXCEPTION 'Migration failed: email_campaigns table not created';
  END IF;

  -- Verify indexes exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaigns_status_created') THEN
    RAISE EXCEPTION 'Migration failed: idx_campaigns_status_created index not created';
  END IF;

  -- Verify view exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'campaign_stats') THEN
    RAISE EXCEPTION 'Migration failed: campaign_stats view not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully: email_campaigns table created';
END $$;
