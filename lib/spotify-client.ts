/**
 * Spotify API Client
 *
 * Wrapper for Spotify Web API with OAuth 2.0 PKCE flow.
 * Implements Proof Key for Code Exchange (PKCE) as required by Spotify.
 *
 * PKCE Flow:
 * 1. Generate random code_verifier (128 chars, crypto-secure)
 * 2. Hash code_verifier with SHA-256 to create code_challenge
 * 3. Send code_challenge in authorization URL
 * 4. Exchange authorization code + code_verifier for access token
 *
 * Security: PKCE prevents authorization code interception attacks
 * Required by: Spotify OAuth best practices (2023+)
 *
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Spotify user profile data
 */
export interface SpotifyUserProfile {
  id: string;
  email?: string;
  display_name?: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
  }>;
}

/**
 * Spotify token response
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * PKCE code verifier/challenge pair
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Spotify API Client
 */
export class SpotifyClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  // Spotify API endpoints
  private readonly AUTH_URL = 'https://accounts.spotify.com/authorize';
  private readonly TOKEN_URL = 'https://accounts.spotify.com/api/token';
  private readonly API_BASE_URL = 'https://api.spotify.com/v1';

  constructor() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing Spotify configuration. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI in .env'
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
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
   * Get Spotify OAuth authorization URL with PKCE
   *
   * @param state - CSRF protection state token
   * @param codeChallenge - PKCE code challenge
   * @returns Authorization URL to redirect user to
   */
  public getAuthorizationUrl(state: string, codeChallenge: string): string {
    const scopes = [
      'user-read-email',
      'user-read-private',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: state,
      scope: scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Uses PKCE code_verifier for verification
   *
   * @param code - Authorization code from Spotify callback
   * @param codeVerifier - PKCE code verifier
   * @returns Token response with access_token
   */
  public async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier,
    });

    try {
      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Spotify token exchange failed: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const tokenData: SpotifyTokenResponse = await response.json();
      return tokenData;
    } catch (error) {
      console.error('SpotifyClient.exchangeCodeForToken error:', error);
      throw new Error(
        `Failed to exchange Spotify code for token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get Spotify user profile
   *
   * @param accessToken - Spotify access token
   * @returns User profile data
   */
  public async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Spotify API request failed: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const profile: SpotifyUserProfile = await response.json();
      return profile;
    } catch (error) {
      console.error('SpotifyClient.getUserProfile error:', error);
      throw new Error(
        `Failed to fetch Spotify user profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
