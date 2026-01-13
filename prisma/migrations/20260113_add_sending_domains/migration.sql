-- CreateTable: sending_domains
-- Artist-owned domains for email sending with DNS verification

CREATE TABLE sending_domains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  dns_records JSONB,
  mailgun_domain_name VARCHAR(255),
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  last_verification_at TIMESTAMP,
  verified_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sending_domains_user_id ON sending_domains(user_id);
CREATE INDEX idx_sending_domains_status ON sending_domains(status);
CREATE INDEX idx_sending_domains_domain ON sending_domains(domain);

-- Unique constraint: Only one verified domain per user at a time
-- This ensures artists have one primary sending domain
CREATE UNIQUE INDEX idx_sending_domains_user_verified
  ON sending_domains(user_id)
  WHERE status = 'verified';

-- Comments for documentation
COMMENT ON TABLE sending_domains IS 'Artist-owned domains for email sending (Mailgun multi-tenant)';
COMMENT ON COLUMN sending_domains.status IS 'pending | dns_configured | verifying | verified | failed';
COMMENT ON COLUMN sending_domains.dns_records IS 'JSON object with SPF, DKIM, DMARC, MX, tracking CNAME records';
COMMENT ON COLUMN sending_domains.mailgun_domain_name IS 'Mailgun internal domain identifier (e.g., mg.geebeat.com)';
COMMENT ON COLUMN sending_domains.verification_attempts IS 'Number of times verification was attempted (for rate limiting)';
COMMENT ON COLUMN sending_domains.last_verification_at IS 'Last verification attempt timestamp';
COMMENT ON COLUMN sending_domains.verified_at IS 'When domain was successfully verified (null if not verified)';
COMMENT ON COLUMN sending_domains.error_message IS 'Last error message from verification failure';
