-- Backstage Database Setup
-- Execute this in Vercel Postgres Query interface

-- Drop tables if they exist (for clean reinstall)
-- DROP TABLE IF EXISTS execution_logs;
-- DROP TABLE IF EXISTS soundcloud_tracks;

-- Main table: tracks that have been processed
CREATE TABLE IF NOT EXISTS soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  email_sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_id ON soundcloud_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_published_at ON soundcloud_tracks(published_at DESC);

-- Execution logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW(),
  new_tracks INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER
);

-- App configuration table
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('soundcloud_tracks', 'execution_logs', 'app_config');

-- Show table structures
\d soundcloud_tracks
\d execution_logs
\d app_config
