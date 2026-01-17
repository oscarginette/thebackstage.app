/**
 * ISoundCloudClient
 *
 * Interface for SoundCloud API operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Purpose:
 * - Decouple domain layer from infrastructure (SoundCloud API implementation)
 * - Enable testing with mocks (no real API calls needed)
 * - Allow switching implementations (different API versions, providers)
 *
 * SOLID Compliance:
 * - DIP: Use cases depend on this interface, not concrete implementation
 * - ISP: Single interface for SoundCloud operations (not generic)
 *
 * Implementation:
 * - Production: SoundCloudAPIClient (infrastructure layer)
 * - Testing: MockSoundCloudClient (test doubles)
 */

/**
 * PKCE (Proof Key for Code Exchange) pair for OAuth 2.1
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * OAuth 2.1 token response
 */
export interface SoundCloudTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * SoundCloud user profile
 */
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

/**
 * Result of a SoundCloud operation (create, update, delete)
 */
export interface SoundCloudOperationResult {
  success: boolean;
  error?: string;
}

/**
 * ISoundCloudClient
 *
 * Contract for all SoundCloud API operations.
 * Implementations MUST handle OAuth 2.1 with PKCE.
 */
export interface ISoundCloudClient {
  /**
   * OAuth 2.1 PKCE Flow
   */

  /**
   * Generate PKCE code_verifier and code_challenge
   * Required by SoundCloud OAuth 2.1 (October 2024+)
   *
   * @returns PKCE pair with code_verifier and code_challenge
   */
  generatePKCE(): PKCEPair;

  /**
   * Generate SoundCloud OAuth authorization URL with PKCE
   *
   * @param state - CSRF protection state token
   * @param redirectUri - OAuth callback URL
   * @param codeChallenge - PKCE code challenge
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(
    state: string,
    redirectUri: string,
    codeChallenge: string
  ): string;

  /**
   * Exchange authorization code for access token
   * Uses PKCE code_verifier for verification
   *
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Must match the redirect_uri from authorization
   * @param codeVerifier - PKCE code verifier
   * @returns Access token response
   */
  exchangeCodeForToken(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<SoundCloudTokenResponse>;

  /**
   * User Profile Operations
   */

  /**
   * Get user profile from access token
   *
   * @param accessToken - SoundCloud access token
   * @returns User profile data
   */
  getUserProfile(accessToken: string): Promise<SoundCloudUserProfile>;

  /**
   * Verification Operations (Read-Only)
   */

  /**
   * Check if user has reposted a track
   * Uses SoundCloud API v2 (more reliable for reposts)
   *
   * @param accessToken - SoundCloud access token
   * @param trackId - Track ID to check for repost
   * @param userId - User ID who should have reposted
   * @returns True if user reposted the track
   */
  checkRepost(
    accessToken: string,
    trackId: string,
    userId: number
  ): Promise<boolean>;

  /**
   * Check if user follows a target user
   *
   * @param accessToken - SoundCloud access token
   * @param targetUserId - User ID to check if being followed
   * @param userId - User ID who should be following
   * @returns True if user follows target user
   */
  checkFollow(
    accessToken: string,
    targetUserId: string,
    userId: number
  ): Promise<boolean>;

  /**
   * Action Operations (Write)
   */

  /**
   * Create a repost for a track
   * Reposts a track as the authenticated user
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID to repost
   * @returns Operation result with success status
   */
  createRepost(
    accessToken: string,
    trackId: string
  ): Promise<SoundCloudOperationResult>;

  /**
   * Create a follow for a user
   * Follows a user as the authenticated user
   *
   * @param accessToken - OAuth access token
   * @param userId - SoundCloud user ID to follow
   * @returns Operation result with success status
   */
  createFollow(
    accessToken: string,
    userId: string
  ): Promise<SoundCloudOperationResult>;

  /**
   * Post a comment on a SoundCloud track
   *
   * IMPORTANT: SoundCloud does not document comment scope explicitly.
   * The OAuth scope may or may not include comment permissions.
   * This method fails gracefully if scope insufficient.
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID
   * @param commentText - Comment text (max 500 chars)
   * @returns Comment ID if successful
   * @throws Error if API call fails (403 Forbidden, 400 Bad Request, etc.)
   */
  postComment(
    accessToken: string,
    trackId: string,
    commentText: string
  ): Promise<string>;

  /**
   * Update a track's purchase URL and title (shopping cart buy link)
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
   * @returns Operation result with success status
   */
  updateTrackPurchaseLink(
    accessToken: string,
    trackId: string,
    purchaseUrl: string,
    purchaseTitle?: string
  ): Promise<SoundCloudOperationResult>;

  /**
   * Configuration
   */

  /**
   * Verify client credentials are configured
   *
   * @returns True if credentials exist
   */
  isConfigured(): boolean;
}
