/**
 * Serialization Utilities
 *
 * Converts domain entities (with Date objects) to JSON-safe objects (ISO strings).
 * Follows CANONICAL_PATTERNS.md standards for API responses.
 *
 * Clean Architecture: Infrastructure layer utility for API presentation.
 */

import { DownloadGate } from '@/domain/entities/DownloadGate';
import { DownloadSubmission } from '@/domain/entities/DownloadSubmission';
import { GateStats } from '@/domain/types/download-gates';

/**
 * Serialized DownloadGate for API responses
 * All dates converted to ISO strings
 * All optional fields explicitly typed as T | null
 */
export interface SerializedDownloadGate {
  id: string;
  userId: number;
  slug: string;
  title: string;
  artistName: string | null;
  genre: string | null;
  description: string | null;
  artworkUrl: string | null;
  fileUrl: string;
  fileSizeMb: number | null;
  fileType: string | null;
  soundcloudTrackId: string | null;
  soundcloudTrackUrl: string | null;
  soundcloudUserId: string | null;
  requireEmail: boolean;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  active: boolean;
  maxDownloads: number | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serializes DownloadGate entity to JSON-safe object
 *
 * @param gate - DownloadGate entity from domain layer
 * @returns SerializedDownloadGate with dates as ISO strings
 */
export function serializeGate(gate: DownloadGate): SerializedDownloadGate {
  return {
    id: gate.id,
    userId: gate.userId,
    slug: gate.slug,
    title: gate.title,
    artistName: gate.artistName,
    genre: gate.genre,
    description: gate.description,
    artworkUrl: gate.artworkUrl,
    fileUrl: gate.fileUrl,
    fileSizeMb: gate.fileSizeMb,
    fileType: gate.fileType,
    soundcloudTrackId: gate.soundcloudTrackId,
    soundcloudTrackUrl: gate.soundcloudTrackUrl,
    soundcloudUserId: gate.soundcloudUserId,
    requireEmail: gate.requireEmail,
    requireSoundcloudRepost: gate.requireSoundcloudRepost,
    requireSoundcloudFollow: gate.requireSoundcloudFollow,
    requireSpotifyConnect: gate.requireSpotifyConnect,
    active: gate.active,
    maxDownloads: gate.maxDownloads,
    expiresAt: gate.expiresAt?.toISOString() ?? null,
    createdAt: gate.createdAt.toISOString(),
    updatedAt: gate.updatedAt.toISOString()
  };
}

/**
 * Serialized DownloadGate with embedded stats
 * Used for list endpoints that include analytics
 */
export interface SerializedDownloadGateWithStats extends SerializedDownloadGate {
  stats: GateStats;
}

/**
 * Serializes DownloadGate with stats
 *
 * @param gate - DownloadGate entity with stats property
 * @param stats - GateStats object
 * @returns SerializedDownloadGateWithStats
 */
export function serializeGateWithStats(
  gate: DownloadGate,
  stats: GateStats
): SerializedDownloadGateWithStats {
  return {
    ...serializeGate(gate),
    stats
  };
}

/**
 * Serialized DownloadSubmission for API responses
 * All dates converted to ISO strings
 */
export interface SerializedDownloadSubmission {
  id: string;
  gateId: string;
  email: string;
  firstName: string | null;
  soundcloudUsername: string | null;
  soundcloudUserId: string | null;
  soundcloudPermalink: string | null;
  spotifyUserId: string | null;
  spotifyDisplayName: string | null;
  emailVerified: boolean;
  soundcloudRepostVerified: boolean;
  soundcloudRepostVerifiedAt: string | null;
  soundcloudFollowVerified: boolean;
  soundcloudFollowVerifiedAt: string | null;
  spotifyConnected: boolean;
  spotifyConnectedAt: string | null;
  downloadToken: string | null;
  downloadTokenGeneratedAt: string | null;
  downloadTokenExpiresAt: string | null;
  downloadCompleted: boolean;
  downloadCompletedAt: string | null;
  consentMarketing: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serializes DownloadSubmission entity to JSON-safe object
 *
 * @param submission - DownloadSubmission entity from domain layer
 * @returns SerializedDownloadSubmission with dates as ISO strings
 */
export function serializeSubmission(
  submission: DownloadSubmission
): SerializedDownloadSubmission {
  return {
    id: submission.id,
    gateId: submission.gateId,
    email: submission.email,
    firstName: submission.firstName ?? null,
    soundcloudUsername: submission.soundcloudUsername ?? null,
    soundcloudUserId: submission.soundcloudUserId ?? null,
    soundcloudPermalink: submission.soundcloudPermalink ?? null,
    spotifyUserId: submission.spotifyUserId ?? null,
    spotifyDisplayName: submission.spotifyDisplayName ?? null,
    emailVerified: submission.emailVerified,
    soundcloudRepostVerified: submission.soundcloudRepostVerified,
    soundcloudRepostVerifiedAt: submission.soundcloudRepostVerifiedAt?.toISOString() ?? null,
    soundcloudFollowVerified: submission.soundcloudFollowVerified,
    soundcloudFollowVerifiedAt: submission.soundcloudFollowVerifiedAt?.toISOString() ?? null,
    spotifyConnected: submission.spotifyConnected,
    spotifyConnectedAt: submission.spotifyConnectedAt?.toISOString() ?? null,
    downloadToken: submission.downloadToken ?? null,
    downloadTokenGeneratedAt: submission.downloadTokenGeneratedAt?.toISOString() ?? null,
    downloadTokenExpiresAt: submission.downloadTokenExpiresAt?.toISOString() ?? null,
    downloadCompleted: submission.downloadCompleted,
    downloadCompletedAt: submission.downloadCompletedAt?.toISOString() ?? null,
    consentMarketing: submission.consentMarketing,
    ipAddress: submission.ipAddress ?? null,
    userAgent: submission.userAgent ?? null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString()
  };
}

/**
 * Serialized public DownloadGate (limited fields)
 * Used for public gate pages - omits sensitive data
 */
export interface SerializedPublicGate {
  id: string;
  slug: string;
  title: string;
  artistName: string | null;
  description: string | null;
  artworkUrl: string | null;
  soundcloudTrackId: string | null;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  active: boolean;
}

/**
 * Serializes DownloadGate for public API (fan-facing)
 * Only includes fields safe for public consumption
 *
 * @param gate - DownloadGate entity
 * @returns SerializedPublicGate with limited fields
 */
export function serializePublicGate(gate: DownloadGate): SerializedPublicGate {
  return {
    id: gate.id,
    slug: gate.slug,
    title: gate.title,
    artistName: gate.artistName,
    description: gate.description,
    artworkUrl: gate.artworkUrl,
    soundcloudTrackId: gate.soundcloudTrackId,
    requireSoundcloudRepost: gate.requireSoundcloudRepost,
    requireSoundcloudFollow: gate.requireSoundcloudFollow,
    requireSpotifyConnect: gate.requireSpotifyConnect,
    active: gate.active
  };
}
