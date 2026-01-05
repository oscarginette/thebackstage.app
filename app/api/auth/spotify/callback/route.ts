/**
 * GET /api/auth/spotify/callback
 * Spotify OAuth Callback (public endpoint)
 *
 * Handles Spotify OAuth callback after user authorizes the application.
 *
 * Flow:
 * 1. Validate state token (CSRF protection)
 * 2. Retrieve code_verifier from oauth_states table
 * 3. Exchange authorization code + code_verifier for access token (PKCE)
 * 4. Get Spotify user profile
 * 5. Update submission with Spotify profile data
 * 6. Follow artist on Spotify (if artist has Spotify ID configured)
 * 7. Create auto-save subscription (if user opted in)
 * 8. Mark oauth_state as used
 * 9. Redirect user back to gate page
 *
 * Clean Architecture: API route orchestrates, use cases contain business logic.
 *
 * Security:
 * - Validates state token (prevents CSRF)
 * - Uses PKCE code_verifier (prevents code interception)
 * - State is single-use (prevents replay attacks)
 * - State expires in 15 minutes
 * - OAuth tokens encrypted at rest with AES-256-GCM
 */

import { NextResponse } from 'next/server';
import { SpotifyClient } from '@/lib/spotify-client';
import { PostgresOAuthStateRepository } from '@/infrastructure/database/repositories/PostgresOAuthStateRepository';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { PostgresAutoSaveSubscriptionRepository } from '@/infrastructure/database/repositories/PostgresAutoSaveSubscriptionRepository';
import { ConnectSpotifyUseCase } from '@/domain/services/ConnectSpotifyUseCase';
import { FollowSpotifyArtistUseCase } from '@/domain/services/FollowSpotifyArtistUseCase';
import { CreateAutoSaveSubscriptionUseCase } from '@/domain/services/CreateAutoSaveSubscriptionUseCase';
import { TokenEncryption } from '@/infrastructure/encryption/TokenEncryption';
import { SpotifyProfile } from '@/domain/types/download-gates';

// Singleton instances
const spotifyClient = new SpotifyClient();
const oauthStateRepository = new PostgresOAuthStateRepository();
const submissionRepository = new PostgresDownloadSubmissionRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();
const downloadGateRepository = new PostgresDownloadGateRepository();
const userRepository = new PostgresUserRepository();
const autoSaveSubscriptionRepository = new PostgresAutoSaveSubscriptionRepository();
const tokenEncryption = new TokenEncryption();

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/spotify/callback
 * Handle Spotify OAuth callback
 *
 * Query params:
 * - code: Authorization code from Spotify
 * - state: State token for CSRF protection
 * - error: Optional error from Spotify (if user denied access)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      console.log('[Spotify OAuth] User denied access:', error);
      return NextResponse.redirect(
        new URL(
          `/gate?error=spotify_denied&message=${encodeURIComponent('You must connect your Spotify account to download')}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: code and state' },
        { status: 400 }
      );
    }

    // 1. Validate state token
    const oauthState = await oauthStateRepository.findByStateToken(state);

    if (!oauthState) {
      console.error('[Spotify OAuth] Invalid state token:', state);
      return NextResponse.redirect(
        new URL(
          '/gate?error=invalid_state&message=Invalid or expired authorization request',
          request.url
        )
      );
    }

    // Check if state is already used
    if (oauthState.used) {
      console.error('[Spotify OAuth] State already used:', oauthState.id);
      return NextResponse.redirect(
        new URL(
          '/gate?error=state_used&message=This authorization request has already been used',
          request.url
        )
      );
    }

    // Check if state is expired
    if (new Date() > oauthState.expiresAt) {
      console.error('[Spotify OAuth] State expired:', oauthState.id);
      return NextResponse.redirect(
        new URL(
          '/gate?error=state_expired&message=Authorization request has expired',
          request.url
        )
      );
    }

    // Check if state has code_verifier (required for PKCE)
    if (!oauthState.codeVerifier) {
      console.error('[Spotify OAuth] Missing code_verifier for state:', oauthState.id);
      return NextResponse.redirect(
        new URL(
          '/gate?error=missing_verifier&message=Invalid authorization request',
          request.url
        )
      );
    }

    console.log('[Spotify OAuth] Valid state found:', {
      stateId: oauthState.id,
      submissionId: oauthState.submissionId,
      gateId: oauthState.gateId,
    });

    // 2. Exchange authorization code for access token (with PKCE)
    let tokenResponse;
    try {
      tokenResponse = await spotifyClient.exchangeCodeForToken(
        code,
        oauthState.codeVerifier
      );
    } catch (error) {
      console.error('[Spotify OAuth] Token exchange failed:', error);
      return NextResponse.redirect(
        new URL(
          '/gate?error=token_exchange_failed&message=Failed to exchange authorization code',
          request.url
        )
      );
    }

    // 3. Get Spotify user profile
    let userProfile;
    try {
      userProfile = await spotifyClient.getUserProfile(tokenResponse.access_token);
    } catch (error) {
      console.error('[Spotify OAuth] Failed to fetch user profile:', error);
      return NextResponse.redirect(
        new URL(
          '/gate?error=profile_fetch_failed&message=Failed to fetch Spotify profile',
          request.url
        )
      );
    }

    console.log('[Spotify OAuth] User profile retrieved:', {
      userId: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.display_name,
    });

    // 4. Prepare Spotify profile data
    const spotifyProfile: SpotifyProfile = {
      userId: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.display_name,
      profileUrl: userProfile.external_urls?.spotify,
      imageUrl: userProfile.images?.[0]?.url,
    };

    // 5. Execute ConnectSpotifyUseCase
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const connectSpotifyUseCase = new ConnectSpotifyUseCase(
      submissionRepository,
      analyticsRepository
    );

    const result = await connectSpotifyUseCase.execute({
      submissionId: oauthState.submissionId,
      spotifyProfile,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      console.error('[Spotify OAuth] ConnectSpotifyUseCase failed:', result.error);
      return NextResponse.redirect(
        new URL(
          `/gate?error=connect_failed&message=${encodeURIComponent(result.error || 'Failed to connect Spotify account')}`,
          request.url
        )
      );
    }

    // 6. Follow artist (non-blocking - connection succeeds even if follow fails)
    if (result.success) {
      try {
        // Get the gate to find the artist user (findBySlug since we don't have userId in this context)
        const gate = await downloadGateRepository.findBySlug(oauthState.gateId);

        if (gate) {
          // Get the artist user to retrieve their Spotify ID
          const artistUser = await userRepository.findById(gate.userId);

          if (artistUser?.spotifyId) {
            console.log('[Spotify OAuth] Attempting to follow artist:', {
              artistSpotifyId: artistUser.spotifyId,
              artistUserId: artistUser.id,
            });

            const followSpotifyArtistUseCase = new FollowSpotifyArtistUseCase(
              spotifyClient,
              submissionRepository
            );

            const followResult = await followSpotifyArtistUseCase.execute({
              submissionId: oauthState.submissionId,
              accessToken: tokenResponse.access_token,
              artistSpotifyId: artistUser.spotifyId,
            });

            if (followResult.success) {
              console.log('[Spotify OAuth] Successfully followed artist:', {
                artistSpotifyId: artistUser.spotifyId,
                alreadyFollowing: followResult.alreadyFollowing,
              });
            } else {
              // Log error but don't fail the connection
              console.error('[Spotify OAuth] Failed to follow artist (non-critical):', followResult.error);
            }

            // 7. Create auto-save subscription (if user opted in and refresh token available)
            if (oauthState.autoSaveOptIn && tokenResponse.refresh_token) {
              try {
                console.log('[Spotify OAuth] Creating auto-save subscription:', {
                  spotifyUserId: userProfile.id,
                  artistSpotifyId: artistUser.spotifyId,
                });

                const createAutoSaveSubscriptionUseCase = new CreateAutoSaveSubscriptionUseCase(
                  autoSaveSubscriptionRepository,
                  tokenEncryption
                );

                const subscriptionResult = await createAutoSaveSubscriptionUseCase.execute({
                  submissionId: oauthState.submissionId,
                  spotifyUserId: userProfile.id,
                  artistUserId: gate.userId,
                  artistSpotifyId: artistUser.spotifyId,
                  accessToken: tokenResponse.access_token,
                  refreshToken: tokenResponse.refresh_token,
                  expiresIn: tokenResponse.expires_in,
                });

                if (subscriptionResult.success) {
                  console.log('[Spotify OAuth] Successfully created auto-save subscription:', {
                    subscriptionId: subscriptionResult.subscriptionId,
                    alreadyExists: subscriptionResult.alreadyExists,
                  });
                } else {
                  console.error('[Spotify OAuth] Failed to create auto-save subscription (non-critical):', subscriptionResult.error);
                }
              } catch (error) {
                console.error('[Spotify OAuth] Error creating auto-save subscription (non-critical):', error);
              }
            }
          } else {
            console.log('[Spotify OAuth] Artist has no Spotify ID configured, skipping follow and auto-save');
          }
        }
      } catch (error) {
        // Non-critical: connection succeeds even if follow or auto-save fails
        console.error('[Spotify OAuth] Error following artist (non-critical):', error);
      }
    }

    // 8. Mark oauth_state as used (prevent replay attacks)
    await oauthStateRepository.markAsUsed(oauthState.id);

    console.log('[Spotify OAuth] Successfully connected Spotify:', {
      submissionId: oauthState.submissionId,
      spotifyUserId: spotifyProfile.userId,
      alreadyConnected: result.alreadyConnected,
    });

    // 9. Redirect back to gate page with success
    // Note: The frontend will need to know which gate to redirect to
    // For now, redirect to a generic success page or back to the gate
    return NextResponse.redirect(
      new URL(
        `/gate/${oauthState.gateId}?spotify_connected=true`,
        request.url
      )
    );
  } catch (error) {
    console.error('GET /api/auth/spotify/callback error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Missing Spotify configuration')) {
        return NextResponse.redirect(
          new URL(
            '/gate?error=config_error&message=Spotify OAuth is not configured',
            new URL(request.url).origin
          )
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        '/gate?error=internal_error&message=An error occurred during Spotify authorization',
        new URL(request.url).origin
      )
    );
  }
}
