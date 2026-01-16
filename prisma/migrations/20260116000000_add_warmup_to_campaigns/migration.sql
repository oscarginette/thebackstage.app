-- Add warm-up columns to email_campaigns table
-- This enables gradual email sending over 7-10 days to build sender reputation

ALTER TABLE email_campaigns
ADD COLUMN warmup_enabled BOOLEAN DEFAULT false,
ADD COLUMN warmup_current_day INT DEFAULT 0,
ADD COLUMN warmup_started_at TIMESTAMP,
ADD COLUMN warmup_paused_at TIMESTAMP,
ADD COLUMN warmup_pause_reason VARCHAR(500);

-- Index for querying active warm-up campaigns (used by cron jobs in Phase 2)
CREATE INDEX idx_email_campaigns_warmup_active
ON email_campaigns(warmup_enabled, warmup_current_day)
WHERE warmup_enabled = true;

-- Index for finding paused campaigns (used by admin dashboard)
CREATE INDEX idx_email_campaigns_warmup_paused
ON email_campaigns(warmup_paused_at)
WHERE warmup_paused_at IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN email_campaigns.warmup_enabled IS 'Whether gradual warm-up is enabled for this campaign';
COMMENT ON COLUMN email_campaigns.warmup_current_day IS 'Current day of warm-up (0=not started, 1-7=active, 8+=complete)';
COMMENT ON COLUMN email_campaigns.warmup_started_at IS 'When warm-up was initiated';
COMMENT ON COLUMN email_campaigns.warmup_paused_at IS 'When warm-up was paused (NULL if active)';
COMMENT ON COLUMN email_campaigns.warmup_pause_reason IS 'Reason for pause (high bounce rate, user request, etc.)';
