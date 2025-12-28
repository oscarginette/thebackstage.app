/**
 * SoundCloud API Client
 *
 * Wrapper for SoundCloud API v2 endpoints.
 * Handles OAuth flow and user verification (repost, follow).
 *
 * Documentation:
 * - OAuth: https://developers.soundcloud.com/docs/api/guide#authentication
 * - API v2: Uses undocumented but stable v2 endpoints
 *
 * Security:
 * - CSRF protection via state tokens
 * - Client secret never exposed to browser
 * - Access tokens stored server-side only
 */

const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';
const SOUNDCLOUD_API_V2_BASE = 'https://api-v2.soundcloud.com';

export interface SoundCloudAuthUrlParams {
  state: string;
  redirectUri: string;
}

export interface SoundCloudTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SoundCloudUserProfile {
  id: number;
  username: string;
  permalink: string;
  permalink_url: string;
  avatar_url?: string;
  country?: string;
  full_name?: string;
  city?: string;
  description?: string;
  followers_count: number;
  followings_count: number;
  track_count: number;
}

export interface SoundCloudRepost {
  type: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
}

export class SoundCloudClient {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.SOUNDCLOUD_CLIENT_ID || '';
    this.clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('SoundCloud credentials not configured');
    }
  }

  /**
   * Generate SoundCloud OAuth authorization URL
   * @param state - CSRF protection state token
   * @param redirectUri - OAuth callback URL
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'non-expiring', // Scope for API access
      state,
    });

    return `${SOUNDCLOUD_API_BASE}/connect?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Must match the redirect_uri from authorization
   * @returns Access token response
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<SoundCloudTokenResponse> {
    try {
      const response = await fetch(`${SOUNDCLOUD_API_BASE}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SoundCloud token exchange error:', error);
      throw new Error(
        `Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user profile from access token
   * @param accessToken - SoundCloud access token
   * @returns User profile data
   */
  async getUserProfile(accessToken: string): Promise<SoundCloudUserProfile> {
    try {
      const response = await fetch(`${SOUNDCLOUD_API_BASE}/me?oauth_token=${accessToken}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get user profile: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SoundCloud getUserProfile error:', error);
      throw new Error(
        `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if user has reposted a track
   * Uses SoundCloud API v2 (more reliable for reposts)
   * @param accessToken - SoundCloud access token
   * @param trackId - Track ID to check for repost
   * @param userId - User ID who should have reposted
   * @returns True if user reposted the track
   */
  async checkRepost(
    accessToken: string,
    trackId: string,
    userId: number
  ): Promise<boolean> {
    try {
      // Get user's reposts (API v2)
      const response = await fetch(
        `${SOUNDCLOUD_API_V2_BASE}/users/${userId}/track_reposts?client_id=${this.clientId}&oauth_token=${accessToken}&limit=50`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get reposts: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const reposts: SoundCloudRepost[] = data.collection || [];

      // Check if trackId exists in user's reposts
      // Note: The repost object contains a 'track' field with the track data
      const hasReposted = reposts.some((repost: any) => {
        return repost.track && repost.track.id.toString() === trackId.toString();
      });

      return hasReposted;
    } catch (error) {
      console.error('SoundCloud checkRepost error:', error);
      throw new Error(
        `Failed to check repost: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if user follows a target user
   * @param accessToken - SoundCloud access token
   * @param targetUserId - User ID to check if being followed
   * @param userId - User ID who should be following
   * @returns True if user follows target user
   */
  async checkFollow(
    accessToken: string,
    targetUserId: string,
    userId: number
  ): Promise<boolean> {
    try {
      // Get user's followings
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/users/${userId}/followings?oauth_token=${accessToken}&client_id=${this.clientId}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get followings: ${response.status} ${errorText}`);
      }

      const followings: SoundCloudUserProfile[] = await response.json();

      // Check if targetUserId exists in followings
      const isFollowing = followings.some(
        (following) => following.id.toString() === targetUserId.toString()
      );

      return isFollowing;
    } catch (error) {
      console.error('SoundCloud checkFollow error:', error);
      throw new Error(
        `Failed to check follow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify client credentials are configured
   * @returns True if credentials exist
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }
}

/**
 * Singleton instance
 * Use this for all SoundCloud API calls
 */
export const soundCloudClient = new SoundCloudClient();
