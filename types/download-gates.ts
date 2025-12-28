export interface DownloadGate {
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
  stats: DownloadGateStats;
}

export interface DownloadGateStats {
  views: number;
  submissions: number;
  downloads: number;
  conversionRate: number;
  soundcloudReposts: number;
  soundcloudFollows: number;
  spotifyConnections: number;
}

export interface DownloadSubmission {
  id: string;
  gateId: string;
  email: string;
  firstName: string | null;
  soundcloudUsername: string | null;
  soundcloudUserId: string | null;
  spotifyUserId: string | null;
  emailVerified: boolean;
  soundcloudRepostVerified: boolean;
  soundcloudFollowVerified: boolean;
  spotifyConnected: boolean;
  downloadCompleted: boolean;
  downloadCompletedAt: string | null;
  consentMarketing: boolean;
  createdAt: string;
}

export interface CreateGateFormData {
  title: string;
  artistName?: string;
  genre?: string;
  description?: string;
  soundcloudTrackUrl: string;
  soundcloudTrackId?: string;
  artworkUrl?: string;
  fileUrl: string;
  fileSizeMb?: number;
  fileType: string;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  maxDownloads?: number;
  expiresAt?: string;
  slug?: string;
}
