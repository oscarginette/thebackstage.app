-- Migration: Brevo Integration (Multi-tenant)
-- Allows each user to connect their own Brevo account via API key

-- Table: brevo_integrations
-- Stores encrypted Brevo API keys per user
CREATE TABLE IF NOT EXISTS brevo_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Encrypted API key (using pgcrypto or application-level encryption)
  api_key_encrypted TEXT NOT NULL,

  -- Account info from Brevo
  account_email VARCHAR(255),
  account_name VARCHAR(255),
  company_name VARCHAR(255),

  -- Connection status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  last_error TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- One integration per user
  CONSTRAINT unique_user_brevo UNIQUE (user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_brevo_integrations_user_id
  ON brevo_integrations(user_id);

-- Index for active integrations
CREATE INDEX IF NOT EXISTS idx_brevo_integrations_active
  ON brevo_integrations(user_id, is_active) WHERE is_active = true;

-- Table: brevo_import_history
-- Tracks each import operation for audit trail
CREATE TABLE IF NOT EXISTS brevo_import_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES brevo_integrations(id) ON DELETE CASCADE,

  -- Import stats
  contacts_fetched INTEGER DEFAULT 0,
  contacts_inserted INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  contacts_skipped INTEGER DEFAULT 0,
  lists_processed INTEGER DEFAULT 0,

  -- Execution info
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Error tracking
  error_message TEXT,
  errors_detail JSONB, -- Array of specific contact errors

  -- Metadata
  metadata JSONB
);

-- Index for user import history
CREATE INDEX IF NOT EXISTS idx_brevo_import_history_user_id
  ON brevo_import_history(user_id, started_at DESC);

-- Index for integration history
CREATE INDEX IF NOT EXISTS idx_brevo_import_history_integration_id
  ON brevo_import_history(integration_id, started_at DESC);

-- Update contacts table to track import source per user
-- (Already exists, but ensure it supports multi-tenant)
DO $$
BEGIN
  -- Add brevo_list_ids column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'brevo_list_ids'
  ) THEN
    ALTER TABLE contacts ADD COLUMN brevo_list_ids INTEGER[];
  END IF;

  -- Add brevo_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'brevo_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN brevo_id VARCHAR(255);
  END IF;
END $$;

-- Index for Brevo ID lookups (avoid duplicates during import)
CREATE INDEX IF NOT EXISTS idx_contacts_brevo_id
  ON contacts(user_id, brevo_id) WHERE brevo_id IS NOT NULL;

-- Function: Updated trigger for brevo_integrations
CREATE OR REPLACE FUNCTION update_brevo_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on brevo_integrations
DROP TRIGGER IF EXISTS trigger_update_brevo_integration_timestamp
  ON brevo_integrations;
CREATE TRIGGER trigger_update_brevo_integration_timestamp
  BEFORE UPDATE ON brevo_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_brevo_integration_timestamp();

-- View: brevo_integration_stats
-- Provides quick stats about Brevo integrations per user
CREATE OR REPLACE VIEW brevo_integration_stats AS
SELECT
  bi.user_id,
  bi.id as integration_id,
  bi.account_email,
  bi.is_active,
  bi.last_sync_at,
  COUNT(c.id) as total_contacts_from_brevo,
  COUNT(c.id) FILTER (WHERE c.subscribed = true) as subscribed_from_brevo,
  (
    SELECT COUNT(*)
    FROM brevo_import_history bih
    WHERE bih.integration_id = bi.id
  ) as total_imports,
  (
    SELECT MAX(started_at)
    FROM brevo_import_history bih
    WHERE bih.integration_id = bi.id AND bih.status = 'completed'
  ) as last_successful_import
FROM brevo_integrations bi
LEFT JOIN contacts c ON c.user_id = bi.user_id AND c.brevo_id IS NOT NULL
GROUP BY bi.id, bi.user_id, bi.account_email, bi.is_active, bi.last_sync_at;

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON brevo_integrations TO authenticated_users;
-- GRANT SELECT, INSERT ON brevo_import_history TO authenticated_users;
-- GRANT SELECT ON brevo_integration_stats TO authenticated_users;

-- Comments for documentation
COMMENT ON TABLE brevo_integrations IS
  'Stores Brevo API key integrations per user (multi-tenant)';
COMMENT ON TABLE brevo_import_history IS
  'Audit trail of contact import operations from Brevo';
COMMENT ON COLUMN brevo_integrations.api_key_encrypted IS
  'Encrypted Brevo API key (never store in plaintext)';
COMMENT ON COLUMN contacts.brevo_id IS
  'Brevo contact ID for deduplication during imports';
COMMENT ON COLUMN contacts.brevo_list_ids IS
  'Array of Brevo list IDs this contact belongs to';
