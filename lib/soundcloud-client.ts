/**
 * SoundCloud API Client
 *
 * Wrapper for SoundCloud API with OAuth 2.1 PKCE flow.
 * Implements Proof Key for Code Exchange (PKCE) as required by SoundCloud.
 *
 * PKCE Flow:
 * 1. Generate random code_verifier (128 chars, crypto-secure)
 * 2. Hash code_verifier with SHA-256 to create code_challenge
 * 3. Send code_challenge in authorization URL
 * 4. Exchange authorization code + code_verifier for access token
 *
 * Security:
 * - PKCE prevents authorization code interception attacks
 * - CSRF protection via state tokens
 * - Client secret never exposed to browser
 * - Access tokens stored server-side only
 *
 * Required by: SoundCloud OAuth 2.1 (October 2024+)
 *
 * Documentation:
 * - OAuth 2.1: https://developers.soundcloud.com/docs/api/guide#authentication
 * - Migration: https://developers.soundcloud.com/blog/oauth-migration/
 * - API v2: Uses stable v2 endpoints for repost/follow verification
 */

import { randomBytes, createHash } from 'crypto';
import { env } from '@/lib/env';

// OAuth 2.1 endpoints (updated October 2024)
const SOUNDCLOUD_AUTH_URL = 'https://secure.soundcloud.com/authorize';
const SOUNDCLOUD_TOKEN_URL = 'https://secure.soundcloud.com/oauth/token';

// API endpoints (unchanged)
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

/**
 * PKCE code verifier/challenge pair
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export class SoundCloudClient {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    // Use validated environment variables (optional, so we use empty strings as fallback)
    this.clientId = env.SOUNDCLOUD_CLIENT_ID || '';
    this.clientSecret = env.SOUNDCLOUD_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('SoundCloud credentials not configured');
    }
  }

  /**
   * Generate PKCE code_verifier and code_challenge
   *
   * code_verifier: Random 128-character string (A-Z, a-z, 0-9, -, ., _, ~)
   * code_challenge: Base64URL-encoded SHA256 hash of code_verifier
   *
   * @returns PKCE pair with code_verifier and code_challenge
   */
  public generatePKCE(): PKCEPair {
    // Generate 64 random bytes (will become 128 hex chars)
    const codeVerifier = this.base64URLEncode(randomBytes(64));

    // Create SHA-256 hash of code_verifier
    const hash = createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = this.base64URLEncode(hash);

    return {
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Generate SoundCloud OAuth authorization URL with PKCE
   * @param state - CSRF protection state token
   * @param redirectUri - OAuth callback URL
   * @param codeChallenge - PKCE code challenge
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string, redirectUri: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      // Note: SoundCloud OAuth 2.1 doesn't require explicit scope parameter
      // Omitting it uses default permissions (user profile, tracks, comments, reposts)
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `${SOUNDCLOUD_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Uses PKCE code_verifier for verification
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Must match the redirect_uri from authorization
   * @param codeVerifier - PKCE code verifier
   * @returns Access token response
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<SoundCloudTokenResponse> {
    try {
      const response = await fetch(SOUNDCLOUD_TOKEN_URL, {
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
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SoundCloudClient] exchangeCodeForToken error:', error);
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
      // OAuth 2.1 requires Authorization header instead of oauth_token query param
      const response = await fetch(`${SOUNDCLOUD_API_BASE}/me`, {
        headers: {
          Authorization: `OAuth ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get user profile: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SoundCloudClient] getUserProfile error:', error);
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
      // Get user's reposts (API v2) - OAuth 2.1 requires Authorization header
      const response = await fetch(
        `${SOUNDCLOUD_API_V2_BASE}/users/${userId}/track_reposts?client_id=${this.clientId}&limit=50`,
        {
          headers: {
            Authorization: `OAuth ${accessToken}`,
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
      console.error('[SoundCloudClient] checkRepost error:', error);
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
      // Get user's followings - OAuth 2.1 requires Authorization header
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/users/${userId}/followings?client_id=${this.clientId}`,
        {
          headers: {
            Authorization: `OAuth ${accessToken}`,
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
   * Create a repost for a track
   * Reposts a track as the authenticated user
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID to repost
   * @returns Success status
   * @throws Error if API call fails (401 Unauthorized, 404 Not Found, etc.)
   */
  async createRepost(
    accessToken: string,
    trackId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/reposts/tracks/${trackId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `OAuth ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 401) {
          return {
            success: false,
            error: `Invalid or expired access token (401 Unauthorized).`,
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            error: `Track not found (404). Invalid track ID: ${trackId}`,
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            error: `Insufficient permissions to repost (403 Forbidden).`,
          };
        }

        return {
          success: false,
          error: `Failed to create repost: ${response.status} ${errorText}`,
        };
      }

      console.log('[SoundCloudClient] Successfully created repost for track:', trackId);
      return { success: true };
    } catch (error) {
      console.error('[SoundCloudClient] createRepost error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a follow for a user
   * Follows a user as the authenticated user
   *
   * @param accessToken - OAuth access token
   * @param userId - SoundCloud user ID to follow
   * @returns Success status
   * @throws Error if API call fails (401 Unauthorized, 404 Not Found, etc.)
   */
  async createFollow(
    accessToken: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/me/followings/${userId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `OAuth ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 401) {
          return {
            success: false,
            error: `Invalid or expired access token (401 Unauthorized).`,
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            error: `User not found (404). Invalid user ID: ${userId}`,
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            error: `Insufficient permissions to follow (403 Forbidden).`,
          };
        }

        return {
          success: false,
          error: `Failed to create follow: ${response.status} ${errorText}`,
        };
      }

      console.log('[SoundCloudClient] Successfully followed user:', userId);
      return { success: true };
    } catch (error) {
      console.error('[SoundCloudClient] createFollow error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Post a comment on a SoundCloud track
   *
   * IMPORTANT: SoundCloud does not document comment scope explicitly.
   * The 'non-expiring' scope may or may not include comment permissions.
   * This method fails gracefully if scope insufficient.
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID
   * @param commentText - Comment text (max 500 chars)
   * @returns Comment ID if successful
   * @throws Error if API call fails (403 Forbidden, 400 Bad Request, etc.)
   */
  async postComment(
    accessToken: string,
    trackId: string,
    commentText: string
  ): Promise<string> {
    try {
      // Validate comment text length
      if (!commentText || commentText.trim().length === 0) {
        throw new Error('Comment text cannot be empty');
      }

      if (commentText.length > 500) {
        throw new Error('Comment text exceeds maximum length (500 characters)');
      }

      // POST to SoundCloud API - OAuth 2.1 requires Authorization header
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/tracks/${trackId}/comments?client_id=${this.clientId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `OAuth ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            'comment[body]': commentText,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(
            `Insufficient permissions to comment (403 Forbidden). The 'non-expiring' scope may not include comment permissions.`
          );
        }

        if (response.status === 400) {
          throw new Error(`Invalid comment data (400 Bad Request): ${errorText}`);
        }

        throw new Error(`Failed to post comment: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Return comment ID from response
      if (!data.id && !data.comment_id) {
        throw new Error('Comment posted but no ID returned from API');
      }

      return (data.id || data.comment_id).toString();
    } catch (error) {
      console.error('[SoundCloudClient] postComment error:', error);
      throw new Error(
        `Failed to post comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Updates a track's purchase URL and title (shopping cart buy link)
   *
   * After OAuth authorization, this method programmatically adds a buy link to a SoundCloud track.
   * A shopping cart icon appears below the track waveform, redirecting users to the specified URL.
   *
   * IMPORTANT NOTES:
   * - Only track owner can update purchase_url (access token must belong to track owner)
   * - purchase_title is unreliable on free accounts (API accepts but returns null)
   * - purchase_title works reliably only on Artist Pro accounts
   * - Best-effort service (failures logged, don't block downloads)
   *
   * @param accessToken - OAuth access token (must be from track owner)
   * @param trackId - SoundCloud track ID (numeric string)
   * @param purchaseUrl - External purchase/download link (e.g., Download Gate URL)
   * @param purchaseTitle - Custom button text (optional, e.g., "Download Free Track")
   * @returns Result object with success status and error message if failed
   */
  async updateTrackPurchaseLink(
    accessToken: string,
    trackId: string,
    purchaseUrl: string,
    purchaseTitle?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!accessToken || !trackId || !purchaseUrl) {
        return {
          success: false,
          error: 'Missing required parameters (accessToken, trackId, or purchaseUrl)',
        };
      }

      // Build request body
      const trackData: any = {
        track: {
          purchase_url: purchaseUrl,
        },
      };

      // Only include purchase_title if provided (unreliable on free accounts)
      if (purchaseTitle && purchaseTitle.trim().length > 0) {
        trackData.track.purchase_title = purchaseTitle;
      }

      // PUT to SoundCloud API - OAuth 2.1 requires Authorization header
      const response = await fetch(
        `${SOUNDCLOUD_API_BASE}/tracks/${trackId}?client_id=${this.clientId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `OAuth ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(trackData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 403) {
          return {
            success: false,
            error: `Insufficient permissions to update track (403 Forbidden). User must own the track.`,
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            error: `Track not found (404). Invalid track ID: ${trackId}`,
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            error: `Invalid or expired access token (401 Unauthorized).`,
          };
        }

        return {
          success: false,
          error: `SoundCloud API error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Verify purchase_url was set
      if (data.purchase_url !== purchaseUrl) {
        console.warn(
          '[SoundCloudClient] Purchase URL mismatch (may be normal for free accounts):',
          {
            expected: purchaseUrl,
            actual: data.purchase_url,
          }
        );
      }

      // Warn if purchase_title was ignored (common on free accounts)
      if (purchaseTitle && data.purchase_title !== purchaseTitle) {
        console.warn(
          '[SoundCloudClient] Purchase title was ignored (likely free account):',
          {
            expected: purchaseTitle,
            actual: data.purchase_title,
          }
        );
      }

      console.log('[SoundCloudClient] Successfully updated track purchase link:', {
        trackId,
        purchase_url: data.purchase_url,
        purchase_title: data.purchase_title,
      });

      return { success: true };
    } catch (error) {
      console.error('[SoundCloudClient] updateTrackPurchaseLink error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify client credentials are configured
   * @returns True if credentials exist
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Base64URL encode (RFC 4648)
   * Converts Buffer to base64url encoding (no padding, URL-safe)
   *
   * @param buffer - Buffer to encode
   * @returns Base64URL encoded string
   */
  private base64URLEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

/**
 * Singleton instance
 * Use this for all SoundCloud API calls
 */
export const soundCloudClient = new SoundCloudClient();
