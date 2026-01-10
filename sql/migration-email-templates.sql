-- Migration: Email Templates System
-- Adds email template management with MJML support and versioning
-- Run after: migration-email-events.sql

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- MJML content and compiled HTML
  mjml_content JSONB NOT NULL,
  html_snapshot TEXT NOT NULL,

  -- Template management
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  parent_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_default ON email_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_parent ON email_templates(parent_template_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_created ON email_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(deleted_at) WHERE deleted_at IS NULL;

-- Ensure only one default template at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_single_default
  ON email_templates(is_default)
  WHERE is_default = true AND deleted_at IS NULL;

-- Add template_id to email_logs to track which template was used
ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES email_templates(id);

-- Create index on email_logs template_id
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);

-- Create default template (migrate existing React Email template)
INSERT INTO email_templates (
  name,
  description,
  mjml_content,
  html_snapshot,
  is_default,
  version
)
SELECT
  'Default Track Announcement',
  'Default template for announcing new music tracks (migrated from React Email)',
  '{"tagName":"mjml","attributes":{},"children":[{"tagName":"mj-head","children":[{"tagName":"mj-title","content":"New Track from The Backstage"},{"tagName":"mj-attributes","children":[{"tagName":"mj-all","attributes":{"font-family":"Arial, sans-serif"}},{"tagName":"mj-text","attributes":{"font-size":"16px","color":"#333333","line-height":"24px"}}]}]},{"tagName":"mj-body","attributes":{"background-color":"#f4f4f4"},"children":[{"tagName":"mj-section","attributes":{"background-color":"#ffffff","padding":"20px"},"children":[{"tagName":"mj-column","children":[{"tagName":"mj-text","attributes":{"font-size":"24px","font-weight":"bold","align":"center"},"content":"{{greeting}}"},{"tagName":"mj-spacer","attributes":{"height":"20px"}},{"tagName":"mj-image","attributes":{"src":"{{coverImage}}","alt":"Track Cover","width":"400px"}},{"tagName":"mj-spacer","attributes":{"height":"20px"}},{"tagName":"mj-text","attributes":{"font-size":"18px","align":"center"},"content":"{{message}}"},{"tagName":"mj-spacer","attributes":{"height":"20px"}},{"tagName":"mj-button","attributes":{"background-color":"#000000","color":"#ffffff","href":"{{trackUrl}}"},"content":"LISTEN NOW"},{"tagName":"mj-spacer","attributes":{"height":"20px"}},{"tagName":"mj-text","attributes":{"align":"center"},"content":"{{signature}}"},{"tagName":"mj-spacer","attributes":{"height":"20px"}},{"tagName":"mj-text","attributes":{"font-size":"12px","color":"#999999","align":"center"},"content":"<a href=\"{{unsubscribeUrl}}\" style=\"color: #999999;\">Unsubscribe</a>"}]}]}]}]}'::jsonb,
  '<html><!-- Default template HTML placeholder --></html>',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE is_default = true);

-- Create view for template analytics
CREATE OR REPLACE VIEW template_usage_stats AS
SELECT
  et.id as template_id,
  et.name as template_name,
  et.is_default,
  COUNT(el.id) as total_emails_sent,
  COUNT(el.id) FILTER (WHERE el.delivered_at IS NOT NULL) as delivered,
  COUNT(el.id) FILTER (WHERE el.opened_at IS NOT NULL) as opened,
  COUNT(el.id) FILTER (WHERE el.clicked_at IS NOT NULL) as clicked,
  ROUND(
    100.0 * COUNT(el.id) FILTER (WHERE el.opened_at IS NOT NULL) /
    NULLIF(COUNT(el.id) FILTER (WHERE el.delivered_at IS NOT NULL), 0),
    2
  ) as open_rate,
  ROUND(
    100.0 * COUNT(el.id) FILTER (WHERE el.clicked_at IS NOT NULL) /
    NULLIF(COUNT(el.id) FILTER (WHERE el.opened_at IS NOT NULL), 0),
    2
  ) as click_rate
FROM email_templates et
LEFT JOIN email_logs el ON et.id = el.template_id
WHERE et.deleted_at IS NULL
GROUP BY et.id, et.name, et.is_default;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_email_template_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_timestamp();

COMMENT ON TABLE email_templates IS 'Email templates using MJML format for visual email building';
COMMENT ON COLUMN email_templates.mjml_content IS 'MJML JSON structure from Easy-Email-Editor';
COMMENT ON COLUMN email_templates.html_snapshot IS 'Pre-compiled HTML for performance (regenerated on template save)';
COMMENT ON COLUMN email_templates.parent_template_id IS 'For versioning: links to parent template';
