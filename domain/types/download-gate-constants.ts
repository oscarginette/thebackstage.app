/**
 * Download Gate Constants
 *
 * Type-safe constants for download gate domain.
 * ALWAYS use these instead of string literals.
 *
 * Clean Architecture: Domain types layer
 */

/**
 * Download submission sources (where submission originated)
 * Used to track multi-brand consent (The Backstage vs Gee Beat)
 */
export const DOWNLOAD_SOURCES = {
  THE_BACKSTAGE: 'the_backstage' as const,
  GEE_BEAT: 'gee_beat' as const,
  DOWNLOAD_GATE_FORM: 'download_gate_form' as const,
  EMAIL_LINK: 'email_link' as const,
  ADMIN_ACTION: 'admin_action' as const,
} as const;

export type DownloadSource = typeof DOWNLOAD_SOURCES[keyof typeof DOWNLOAD_SOURCES];

/**
 * Download status for tracking submission progress
 */
export const DOWNLOAD_STATUS = {
  PENDING_VERIFICATION: 'pending_verification' as const,
  VERIFIED: 'verified' as const,
  TOKEN_GENERATED: 'token_generated' as const,
  DOWNLOAD_COMPLETED: 'download_completed' as const,
  EXPIRED: 'expired' as const,
} as const;

export type DownloadStatus = typeof DOWNLOAD_STATUS[keyof typeof DOWNLOAD_STATUS];

/**
 * Download token configuration
 * SECURITY: Crypto-secure token generation settings
 */
export const DOWNLOAD_TOKEN_CONFIG = {
  LENGTH_BYTES: 32, // 32 bytes = 64 hex characters
  EXPIRY_HOURS: 24, // Token valid for 24 hours
  EXPIRY_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Gate requirement types
 */
export const GATE_REQUIREMENTS = {
  EMAIL: 'email' as const,
  SOUNDCLOUD_REPOST: 'soundcloud_repost' as const,
  SOUNDCLOUD_FOLLOW: 'soundcloud_follow' as const,
  SPOTIFY_CONNECT: 'spotify_connect' as const,
  INSTAGRAM_FOLLOW: 'instagram_follow' as const,
} as const;

export type GateRequirement = typeof GATE_REQUIREMENTS[keyof typeof GATE_REQUIREMENTS];

/**
 * Consent brands for multi-brand opt-in
 * User accepts receiving emails from these brands
 */
export const CONSENT_BRANDS = {
  THE_BACKSTAGE: 'the_backstage' as const,
  GEE_BEAT: 'gee_beat' as const,
  DJ_ARTIST: 'dj_artist' as const, // Individual DJ/artist
} as const;

export type ConsentBrand = typeof CONSENT_BRANDS[keyof typeof CONSENT_BRANDS];

/**
 * Download consent metadata
 * Tracks which brands user consented to
 */
export interface DownloadConsentMetadata {
  acceptedBackstage: boolean;
  acceptedGeeBeat: boolean;
  acceptedArtist: boolean;
  source: DownloadSource;
  gateSlug?: string;
  trackTitle?: string;
  artistName?: string;
}
