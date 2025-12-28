/**
 * Download Gates Type Definitions
 *
 * Type definitions for the download gates system.
 * Used across domain entities and repositories.
 *
 * Clean Architecture: Domain types with no external dependencies.
 */

// Event types for analytics tracking
export type EventType = 'view' | 'submit' | 'download';

// OAuth provider types
export type OAuthProvider = 'soundcloud' | 'spotify';

// Input types for creating entities

export interface CreateGateInput {
  slug: string;
  title: string;
  artistName?: string;
  genre?: string;
  description?: string;
  artworkUrl?: string;
  soundcloudTrackId?: string;
  soundcloudTrackUrl?: string;
  soundcloudUserId?: string;
  fileUrl: string;
  fileSizeMb?: number;
  fileType?: string;
  requireEmail?: boolean;
  requireSoundcloudRepost?: boolean;
  requireSoundcloudFollow?: boolean;
  requireSpotifyConnect?: boolean;
  active?: boolean;
  maxDownloads?: number;
  expiresAt?: Date;
}

export interface CreateSubmissionInput {
  gateId: string; // UUID
  email: string;
  firstName?: string;
  ipAddress?: string;
  userAgent?: string;
  consentMarketing?: boolean;
}

export interface CreateAnalyticsInput {
  gateId: string; // UUID
  eventType: EventType;
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
}

/**
 * Verification status update for submissions
 */
export interface VerificationStatusUpdate {
  emailVerified?: boolean;
  soundcloudRepostVerified?: boolean;
  soundcloudFollowVerified?: boolean;
  spotifyConnected?: boolean;
}

/**
 * SoundCloud profile data from OAuth
 */
export interface SoundCloudProfile {
  userId: string;
  username: string;
  profileUrl?: string;
  avatarUrl?: string;
}

/**
 * Spotify profile data from OAuth
 */
export interface SpotifyProfile {
  userId: string;
  email?: string;
  displayName?: string;
  profileUrl?: string;
  imageUrl?: string;
}

/**
 * Gate statistics and metrics
 */
export interface GateStats {
  gateId: string; // UUID
  totalViews: number;
  totalSubmissions: number;
  totalDownloads: number;
  conversionRate: number;
  soundcloudReposts: number;
  soundcloudFollows: number;
  spotifyConnects: number;
  averageCompletionTime?: number;
}

/**
 * Analytics event for tracking user actions
 */
export interface AnalyticsEvent {
  id: string; // UUID
  gateId: string; // UUID
  eventType: EventType;
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  createdAt: Date;
}

/**
 * OAuth state for CSRF protection and PKCE
 * Used to secure OAuth flows for SoundCloud and Spotify
 */
export interface OAuthState {
  id: string; // UUID
  stateToken: string;
  provider: OAuthProvider;
  submissionId: string; // UUID
  gateId: string; // UUID
  codeVerifier?: string; // PKCE code verifier (Spotify)
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

/**
 * Input for creating OAuth state
 */
export interface CreateOAuthStateInput {
  stateToken: string;
  provider: OAuthProvider;
  submissionId: string; // UUID
  gateId: string; // UUID
  codeVerifier?: string; // PKCE code verifier (for Spotify)
  expiresAt: Date;
}
