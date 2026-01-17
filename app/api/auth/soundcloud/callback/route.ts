/**
 * GET /api/auth/soundcloud/callback
 * SoundCloud OAuth 2.1 callback handler with PKCE verification (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 *
 * Flow:
 * 1. Validate state token (CSRF protection)
 * 2. Validate PKCE code_verifier exists (OAuth 2.1 requirement)
 * 3. Exchange authorization code + code_verifier for access token
 * 4. Get SoundCloud user profile
 * 5. Update submission with SoundCloud profile
 * 6. Create repost (ALWAYS - programmatically repost the track)
 * 7. Create follow (ALWAYS - programmatically follow the artist)
 * 8. Post comment (ALWAYS if comment text provided)
 * 9. Update track buy link (if enabled - best-effort)
 * 10. Mark state token as used
 * 11. Redirect back to gate page with success/error
 *
 * NOTE: Repost, follow, and comment are ALWAYS attempted (not conditional on gate settings).
 * All actions are best-effort and non-blocking (failures don't prevent download).
 *
 * Query Parameters:
 * - code: Authorization code from SoundCloud
 * - state: State token for CSRF protection
 * - error: OAuth error (if authorization failed)
 *
 * Security:
 * - PKCE prevents authorization code interception (OAuth 2.1)
 * - State token validation (exists, not used, not expired)
 * - One-time use tokens
 * - Access token never exposed to browser
 */

import { NextResponse } from 'next/server';
import { soundCloudClient } from '@/lib/soundcloud-client';
import { UseCaseFactory, RepositoryFactory } from '@/lib/di-container';
import { env, getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/soundcloud/callback
 * Handle SoundCloud OAuth callback
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check if user denied authorization
    if (error) {
      console.error('SoundCloud OAuth error:', error, errorDescription);
      return redirectToGateWithError(
        'SoundCloud authorization was denied',
        null
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return redirectToGateWithError(
        'Missing authorization code or state',
        null
      );
    }

    // 1. Validate state token (CSRF protection)
    const oauthStateRepository = RepositoryFactory.createOAuthStateRepository();
    const oauthState = await oauthStateRepository.findByStateToken(state);

    if (!oauthState) {
      return redirectToGateWithError('Invalid state token', null);
    }

    if (oauthState.used) {
      return redirectToGateWithError('State token already used', null);
    }

    if (oauthState.expiresAt < new Date()) {
      return redirectToGateWithError('State token expired', null);
    }

    if (oauthState.provider !== 'soundcloud') {
      return redirectToGateWithError('Invalid OAuth provider', null);
    }

    // Validate PKCE code_verifier exists (OAuth 2.1 requirement)
    if (!oauthState.codeVerifier) {
      return redirectToGateWithError('Invalid authorization request (missing PKCE)', null);
    }

    // Get gate to construct redirect URL (using public method - no auth required)
    const gateRepository = RepositoryFactory.createDownloadGateRepository();
    const gate = await gateRepository.findByIdPublic(oauthState.gateId.toString());
    if (!gate) {
      console.error('[SoundCloud Callback] Gate not found:', oauthState.gateId);
      return redirectToGateWithError('Gate not found', null);
    }

    try {
      // 2. Exchange code for access token (with PKCE verification)
      const redirectUri =
        env.SOUNDCLOUD_REDIRECT_URI ||
        `${getAppUrl()}/api/auth/soundcloud/callback`;

      const tokenResponse = await soundCloudClient.exchangeCodeForToken(
        code,
        redirectUri,
        oauthState.codeVerifier // OAuth 2.1 PKCE verifier
      );

      // 3. Get SoundCloud user profile
      const userProfile = await soundCloudClient.getUserProfile(
        tokenResponse.access_token
      );

      // 4. Update submission with SoundCloud profile
      const submissionRepository = RepositoryFactory.createDownloadSubmissionRepository();
      await submissionRepository.updateSoundCloudProfile(oauthState.submissionId, {
        userId: userProfile.id.toString(),
        username: userProfile.username,
        profileUrl: userProfile.permalink_url,
        avatarUrl: userProfile.avatar_url,
      });

      // Extract IP and user agent
      const ipAddress = request.headers.get('x-forwarded-for') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // 5. Create repost (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudTrackId) {
        console.log('[SoundCloud Callback] Creating repost for track:', gate.soundcloudTrackId);

        const repostResult = await soundCloudClient.createRepost(
          tokenResponse.access_token,
          gate.soundcloudTrackId
        );

        if (!repostResult.success) {
          console.error('[SoundCloud Callback] Repost creation failed (non-critical):', repostResult.error);
          // Non-blocking - user can still download
        } else {
          console.log('[SoundCloud Callback] Repost created successfully ✓');

          // Update submission verification status
          await submissionRepository.updateVerificationStatus(oauthState.submissionId, {
            soundcloudRepostVerified: true,
          });
        }
      }

      // 5b. Create favorite/like (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudTrackId) {
        console.log('[SoundCloud Callback] Creating favorite/like for track:', gate.soundcloudTrackId);

        const favoriteResult = await soundCloudClient.createFavorite(
          tokenResponse.access_token,
          gate.soundcloudTrackId
        );

        if (!favoriteResult.success) {
          console.error('[SoundCloud Callback] Favorite creation failed (non-critical):', favoriteResult.error);
          // Non-blocking - user can still download
        } else {
          console.log('[SoundCloud Callback] Favorite created successfully ✓');
        }
      }

      // 6. Create follow (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudUserId) {
        console.log('[SoundCloud Callback] Creating follow for user:', gate.soundcloudUserId);

        const followResult = await soundCloudClient.createFollow(
          tokenResponse.access_token,
          gate.soundcloudUserId
        );

        if (!followResult.success) {
          console.error('[SoundCloud Callback] Follow creation failed (non-critical):', followResult.error);
          // Non-blocking - user can still download
        } else {
          console.log('[SoundCloud Callback] Follow created successfully ✓');

          // Update submission verification status
          await submissionRepository.updateVerificationStatus(oauthState.submissionId, {
            soundcloudFollowVerified: true,
          });
        }
      }

      // 7. Post comment (ALWAYS if provided - best-effort, non-blocking)
      if (oauthState.commentText && oauthState.commentText.trim().length > 0 && gate.soundcloudTrackId) {
        console.log('[SoundCloud Callback] Preparing to post comment...');

        // Get track info to calculate random timestamp
        let commentTimestamp: number | undefined;
        try {
          const trackInfo = await soundCloudClient.getTrackInfo(
            tokenResponse.access_token,
            gate.soundcloudTrackId
          );

          if (trackInfo.duration > 0) {
            // Calculate random timestamp between 10% and 90% of track duration
            // This positions the comment at a random point in the waveform
            const minTime = Math.floor(trackInfo.duration * 0.1);
            const maxTime = Math.floor(trackInfo.duration * 0.9);
            commentTimestamp = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

            console.log('[SoundCloud Callback] Calculated comment timestamp:', {
              trackDuration: trackInfo.duration,
              commentTimestamp,
              position: `${((commentTimestamp / trackInfo.duration) * 100).toFixed(1)}%`,
            });
          }
        } catch (error) {
          console.warn('[SoundCloud Callback] Failed to get track duration (comment will post without timestamp):', error);
          // Continue without timestamp - comment will still be posted
        }

        const postCommentUseCase = UseCaseFactory.createPostSoundCloudCommentUseCase();

        const commentResult = await postCommentUseCase.execute({
          submissionId: oauthState.submissionId,
          accessToken: tokenResponse.access_token,
          soundcloudUserId: userProfile.id,
          commentText: oauthState.commentText,
          commentTimestamp,
          ipAddress,
          userAgent,
        });

        if (!commentResult.success) {
          console.error('[SoundCloud Callback] Comment POST failed (non-critical):', commentResult.error);
        } else if (commentResult.posted) {
          console.log('[SoundCloud Callback] Comment posted successfully');
        }
      }

      // 8. Update track buy link (if enabled - best-effort, non-blocking)
      let buyLinkUpdated = false;
      if (gate.enableSoundcloudBuyLink && gate.soundcloudTrackId) {
        const updateBuyLinkUseCase = UseCaseFactory.createUpdateSoundCloudTrackBuyLinkUseCase();

        const buyLinkResult = await updateBuyLinkUseCase.execute({
          gateId: gate.id,
          accessToken: tokenResponse.access_token,
          soundcloudTrackId: gate.soundcloudTrackId,
        });

        if (!buyLinkResult.success) {
          console.error(
            '[SoundCloud Callback] Buy link update failed (non-critical):',
            buyLinkResult.error
          );
        } else {
          console.log('[SoundCloud Callback] Buy link updated successfully');
          buyLinkUpdated = true;
        }
      }

      // 9. Mark state token as used
      await oauthStateRepository.markAsUsed(oauthState.id);

      // 10. Redirect back to gate page with success
      const gateUrl = new URL(`${getAppUrl()}/gate/${gate.slug}`);
      gateUrl.searchParams.set('oauth', 'success');
      gateUrl.searchParams.set('provider', 'soundcloud');
      if (buyLinkUpdated) {
        gateUrl.searchParams.set('buyLink', 'success');
      }
      return NextResponse.redirect(gateUrl.toString());
    } catch (error) {
      console.error('SoundCloud callback processing error:', error);

      // Mark state as used to prevent retry attacks
      await oauthStateRepository.markAsUsed(oauthState.id);

      return redirectToGateWithError(
        error instanceof Error
          ? error instanceof Error ? error.message : "Unknown error"
          : 'Failed to complete SoundCloud authentication',
        gate.slug
      );
    }
  } catch (error) {
    console.error('GET /api/auth/soundcloud/callback error:', error);

    return redirectToGateWithError(
      'An unexpected error occurred',
      null
    );
  }
}

/**
 * Redirect to gate page with error message
 * @param errorMessage - Error message to display
 * @param gateSlug - Gate slug (if known)
 * @returns NextResponse redirect
 */
function redirectToGateWithError(
  errorMessage: string,
  gateSlug: string | null
): NextResponse {
  const baseUrl = getAppUrl();

  if (gateSlug) {
    const url = `${baseUrl}/gate/${gateSlug}?soundcloud=error&error=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(url);
  }

  // If we don't know the gate, redirect to home with error
  const url = `${baseUrl}?error=${encodeURIComponent(errorMessage)}`;
  return NextResponse.redirect(url);
}
