/**
 * Spotify URL/ID Utilities
 *
 * Utilities for extracting and validating Spotify Artist IDs from various formats.
 * Follows the same pattern as SaveSpotifyTrackUseCase.extractTrackIdFromUrl()
 */

/**
 * Extract Spotify Artist ID from URL, URI, or raw ID
 *
 * Supported formats:
 * - https://open.spotify.com/artist/{ARTIST_ID}
 * - https://open.spotify.com/artist/{ARTIST_ID}?si=xxx
 * - spotify:artist:{ARTIST_ID}
 * - {ARTIST_ID} (22 alphanumeric characters)
 *
 * Examples:
 * - extractSpotifyArtistId('https://open.spotify.com/artist/7KdYiTlUhtXvmFgPXcCKf8')
 *   → '7KdYiTlUhtXvmFgPXcCKf8'
 * - extractSpotifyArtistId('https://open.spotify.com/artist/7KdYiTlUhtXvmFgPXcCKf8?si=abc')
 *   → '7KdYiTlUhtXvmFgPXcCKf8'
 * - extractSpotifyArtistId('spotify:artist:7KdYiTlUhtXvmFgPXcCKf8')
 *   → '7KdYiTlUhtXvmFgPXcCKf8'
 * - extractSpotifyArtistId('7KdYiTlUhtXvmFgPXcCKf8')
 *   → '7KdYiTlUhtXvmFgPXcCKf8'
 *
 * @param input - Spotify artist URL, URI, or ID
 * @returns Clean artist ID or null if invalid format
 */
export function extractSpotifyArtistId(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  // Remove whitespace
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  // Format 1: https://open.spotify.com/artist/{ARTIST_ID}
  // Handles both with and without query params (?si=xxx)
  const urlMatch = trimmed.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Format 2: spotify:artist:{ARTIST_ID}
  const uriMatch = trimmed.match(/spotify:artist:([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return uriMatch[1];
  }

  // Format 3: Just the ID itself (22 alphanumeric characters)
  // Spotify IDs are always exactly 22 characters (base-62 encoding)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Invalid format
  return null;
}

/**
 * Validate that a string is a valid Spotify Artist ID
 *
 * Spotify Artist IDs are always exactly 22 alphanumeric characters (base-62).
 *
 * @param id - String to validate
 * @returns true if valid Spotify Artist ID format
 */
export function isValidSpotifyArtistId(id: string | null | undefined): boolean {
  if (!id) {
    return false;
  }

  return /^[a-zA-Z0-9]{22}$/.test(id);
}

/**
 * Extract Spotify Track ID from URL, URI, or raw ID
 *
 * Supported formats:
 * - https://open.spotify.com/track/{TRACK_ID}
 * - https://open.spotify.com/track/{TRACK_ID}?si=xxx
 * - spotify:track:{TRACK_ID}
 * - {TRACK_ID} (22 alphanumeric characters)
 *
 * @param input - Spotify track URL, URI, or ID
 * @returns Clean track ID or null if invalid format
 */
export function extractSpotifyTrackId(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  // Remove whitespace
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  // Format 1: https://open.spotify.com/track/{TRACK_ID}
  const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Format 2: spotify:track:{TRACK_ID}
  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return uriMatch[1];
  }

  // Format 3: Just the ID itself (22 alphanumeric characters)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
