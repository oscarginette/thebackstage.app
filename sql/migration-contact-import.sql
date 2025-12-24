-- Contact Import History Table
-- Tracks all contact import operations (CSV/JSON) with full audit trail
-- Follows pattern from brevo_import_history table

CREATE TABLE IF NOT EXISTS contact_import_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File metadata
  original_filename VARCHAR(500) NOT NULL,
  file_size_bytes INTEGER,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('csv', 'json')),

  -- Import statistics
  rows_total INTEGER DEFAULT 0,
  contacts_inserted INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  contacts_skipped INTEGER DEFAULT 0,

  -- Column mapping (for CSV - stores user-confirmed mapping)
  column_mapping JSONB,

  -- Execution tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'importing', 'completed', 'failed')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Error tracking
  error_message TEXT,
  errors_detail JSONB
);

-- Indexes for performance
CREATE INDEX idx_contact_import_history_user_id
  ON contact_import_history(user_id, started_at DESC);

CREATE INDEX idx_contact_import_history_status
  ON contact_import_history(user_id, status)
  WHERE status IN ('pending', 'parsing', 'importing');

-- Comments for documentation
COMMENT ON TABLE contact_import_history IS 'Audit trail for contact imports from CSV and JSON files';
COMMENT ON COLUMN contact_import_history.column_mapping IS 'Stores the user-confirmed mapping of CSV columns to contact fields (email, name, subscribed)';
COMMENT ON COLUMN contact_import_history.errors_detail IS 'Array of row-specific errors with format: [{row: number, email: string, message: string}]';
