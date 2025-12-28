/**
 * GET /api/auth/spotify
 * Spotify OAuth Authorization Redirect (public endpoint)
 *
 * Initiates Spotify OAuth flow with PKCE for download gate submissions.
 *
 * Flow:
 * 1. Validate query parameters (submissionId, gateId)
 * 2. Generate PKCE code_verifier and code_challenge
 * 3. Generate state token for CSRF protection
 * 4. Store state + code_verifier in oauth_states table
 * 5. Redirect user to Spotify authorization URL
 *
 * Clean Architecture: API route orchestrates, repositories handle data access.
 *
 * Security:
 * - PKCE prevents authorization code interception
 * - State token prevents CSRF attacks
 * - State expires in 15 minutes
 * - State is single-use (marked as used after callback)
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { SpotifyClient } from '@/lib/spotify-client';
import { PostgresOAuthStateRepository } from '@/infrastructure/database/repositories/PostgresOAuthStateRepository';

// Singleton instances
const spotifyClient = new SpotifyClient();
const oauthStateRepository = new PostgresOAuthStateRepository();

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/spotify
 * Initiate Spotify OAuth flow with PKCE
 *
 * Query params:
 * - submissionId: UUID of the download submission
 * - gateId: UUID of the download gate
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const gateId = searchParams.get('gateId');

    // Validate required parameters
    if (!submissionId || !gateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: submissionId and gateId' },
        { status: 400 }
      );
    }

    // Generate PKCE pair
    const { codeVerifier, codeChallenge } = spotifyClient.generatePKCE();

    // Generate state token for CSRF protection (32 bytes = 64 hex chars)
    const stateToken = randomBytes(32).toString('hex');

    // Calculate expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store OAuth state with PKCE code_verifier
    const oauthState = await oauthStateRepository.create({
      stateToken,
      provider: 'spotify',
      submissionId,
      gateId,
      codeVerifier, // PKCE: Store code_verifier for later use
      expiresAt,
    });

    console.log('[Spotify OAuth] Created state:', {
      stateId: oauthState.id,
      submissionId,
      gateId,
      expiresAt: oauthState.expiresAt,
    });

    // Get Spotify authorization URL with PKCE
    const authUrl = spotifyClient.getAuthorizationUrl(stateToken, codeChallenge);

    // Redirect user to Spotify authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('GET /api/auth/spotify error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Missing Spotify configuration')) {
        return NextResponse.json(
          { error: 'Spotify OAuth is not configured on this server' },
          { status: 503 }
        );
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to initiate Spotify authorization' },
      { status: 500 }
    );
  }
}
