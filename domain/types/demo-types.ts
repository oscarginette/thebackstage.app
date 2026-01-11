/**
 * Demo Types and Constants
 *
 * Defines types and constants for the demo system.
 *
 * MANDATORY: Always use these constants instead of string literals.
 */

/**
 * Demo Send Status
 *
 * Tracks the lifecycle of a demo send.
 */
export type DemoSendStatus = 'sent' | 'opened' | 'clicked';

export const DEMO_SEND_STATUS = {
  SENT: 'sent' as const,
  OPENED: 'opened' as const,
  CLICKED: 'clicked' as const,
} as const;

/**
 * Campaign Type
 *
 * Determines the type of email campaign.
 * - Promo: Newsletter to fans about released tracks
 * - Demo: Personalized email to DJs with unreleased music
 */
export type CampaignType = 'promo' | 'demo';

export const CAMPAIGN_TYPES = {
  PROMO: 'promo' as const,
  DEMO: 'demo' as const,
} as const;

/**
 * Demo Support Type
 *
 * Tracks how a DJ supported a demo (manual tracking).
 * - Radio: Played on radio show
 * - DJ Set: Played in live DJ set
 * - Playlist: Added to playlist (Spotify, Apple Music, etc)
 * - Social Media: Shared on social media
 * - Podcast: Featured in podcast
 * - Other: Other type of support
 */
export type DemoSupportType =
  | 'radio'
  | 'dj_set'
  | 'playlist'
  | 'social_media'
  | 'podcast'
  | 'other';

export const DEMO_SUPPORT_TYPES = {
  RADIO: 'radio' as const,
  DJ_SET: 'dj_set' as const,
  PLAYLIST: 'playlist' as const,
  SOCIAL_MEDIA: 'social_media' as const,
  PODCAST: 'podcast' as const,
  OTHER: 'other' as const,
} as const;

/**
 * Demo Send Metadata
 *
 * Additional tracking data for demo sends.
 */
export interface DemoSendMetadata {
  ipAddress?: string;
  userAgent?: string;
  emailClient?: string;
  clickedLinks?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * DJ Metadata
 *
 * DJ-specific metadata stored in contact.metadata.djMetadata
 */
export interface DJMetadata {
  emailSource: string; // MANDATORY (GDPR compliance)
  genres?: string[];
  platforms?: string[]; // SoundCloud, Mixcloud, etc
  location?: string;
  followersCount?: number;
  notes?: string;
}
