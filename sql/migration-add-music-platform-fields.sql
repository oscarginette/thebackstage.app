-- Migration: Add Music Platform Fields to Users Table
-- Description: Adds SoundCloud and Spotify integration fields to users table
-- Author: Claude
-- Date: 2025-12-29

-- =====================================================
-- Add SoundCloud Fields
-- =====================================================
-- soundcloud_id: Numeric user ID (e.g., 1318247880)
-- soundcloud_permalink: Username/permalink (e.g., geebeatmusic)
ALTER TABLE users ADD COLUMN IF NOT EXISTS soundcloud_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS soundcloud_permalink VARCHAR(255);

-- =====================================================
-- Add Spotify Fields
-- =====================================================
-- spotify_id: Artist ID from Spotify (e.g., 3TVXtAsR1Inumwj472S9r4)
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(255);

-- =====================================================
-- Add Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_soundcloud_id ON users(soundcloud_id);
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);

-- =====================================================
-- Add Comments for Documentation
-- =====================================================
COMMENT ON COLUMN users.soundcloud_id IS 'SoundCloud numeric user ID (extracted from profile)';
COMMENT ON COLUMN users.soundcloud_permalink IS 'SoundCloud username/permalink (e.g., geebeatmusic)';
COMMENT ON COLUMN users.spotify_id IS 'Spotify artist ID from profile URL';

-- =====================================================
-- Verification
-- =====================================================
-- To verify the migration:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('soundcloud_id', 'soundcloud_permalink', 'spotify_id');
