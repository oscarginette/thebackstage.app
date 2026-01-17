/**
 * Migration: Set Artist Spotify ID
 * Date: 2026-01-17
 *
 * Problem:
 * - Artist user (ID: 8) has spotify_id = NULL
 * - Spotify OAuth callback skips follow/save when spotify_id is missing
 *
 * Solution:
 * - Update artist record with their Spotify artist ID
 *
 * How to Find Spotify Artist ID:
 * 1. Go to artist's Spotify profile: https://open.spotify.com/artist/ARTIST_ID
 * 2. Copy the ARTIST_ID from the URL
 * 3. Example: https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4
 *    → Artist ID is: 3TVXtAsR1Inumwj472S9r4
 *
 * IMPORTANT: Replace 'YOUR_SPOTIFY_ARTIST_ID' with actual ID before running!
 */

-- Update artist Spotify ID (replace placeholder with real ID)
UPDATE users
SET spotify_id = 'YOUR_SPOTIFY_ARTIST_ID'
WHERE id = 8;

-- Verification query (should show the updated spotify_id):
-- SELECT id, email, spotify_id, soundcloud_id FROM users WHERE id = 8;

-- Example for reference:
-- If artist profile is: https://open.spotify.com/artist/4AVFqumd2ogHFlRbKIjp1t
-- Then run: UPDATE users SET spotify_id = '4AVFqumd2ogHFlRbKIjp1t' WHERE id = 8;
