/**
 * Migration: Add metadata fields to email_campaigns
 *
 * Purpose: Store cover_image_url, greeting, message, and signature separately
 * so drafts can be edited (not just rendered HTML)
 *
 * Date: 2026-01-14
 */

-- Add cover_image_url column
ALTER TABLE email_campaigns
ADD COLUMN cover_image_url VARCHAR(1000) NULL;

-- Add greeting, message, signature columns for draft editing
ALTER TABLE email_campaigns
ADD COLUMN greeting TEXT NULL;

ALTER TABLE email_campaigns
ADD COLUMN message TEXT NULL;

ALTER TABLE email_campaigns
ADD COLUMN signature TEXT NULL;

-- Add index for faster cover image queries
CREATE INDEX idx_email_campaigns_cover_image ON email_campaigns(cover_image_url)
WHERE cover_image_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN email_campaigns.cover_image_url IS 'Cloudinary URL for cover image (stored separately for draft editing)';
COMMENT ON COLUMN email_campaigns.greeting IS 'Email greeting (stored separately for draft editing)';
COMMENT ON COLUMN email_campaigns.message IS 'Email message content (stored separately for draft editing)';
COMMENT ON COLUMN email_campaigns.signature IS 'Email signature (stored separately for draft editing)';
