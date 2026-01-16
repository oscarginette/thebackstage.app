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
  requireInstagramFollow: boolean;
  instagramProfileUrl: string | null;
  requireSpotifyConnect: boolean;
  enableSoundcloudBuyLink: boolean;
  active: boolean;
  maxDownloads: number | null;
  expiresAt: string | null;
  pixelConfig?: {
    facebook?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
      testEventCode?: string;
    };
    google?: {
      enabled: boolean;
      tagId: string;
      conversionLabels?: {
        view?: string;
        submit?: string;
        download?: string;
      };
    };
    tiktok?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
  } | null;
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
  instagramClickTracked: boolean;
  instagramClickTrackedAt: string | null;
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
  fileType: 'audio' | 'video' | 'image' | 'document' | 'other'; // ✅ Match backend enum
  collectEmail?: boolean;
  collectName?: boolean;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireInstagramFollow: boolean;
  instagramProfileUrl?: string;
  requireSpotifyConnect: boolean;
  enableSoundcloudBuyLink?: boolean;
  customMessage?: string;
  maxDownloads?: number;
  expiresAt?: string;
  slug?: string;
  isActive?: boolean;
}
