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
 * 6. Verify repost (if required by gate)
 * 7. Verify follow (if required by gate)
 * 8. Mark state token as used
 * 9. Redirect back to gate page with success/error
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

      // 5. Post comment (if provided - best-effort, non-blocking)
      if (oauthState.commentText && oauthState.commentText.trim().length > 0) {
        const postCommentUseCase = UseCaseFactory.createPostSoundCloudCommentUseCase();

        const commentResult = await postCommentUseCase.execute({
          submissionId: oauthState.submissionId,
          accessToken: tokenResponse.access_token,
          soundcloudUserId: userProfile.id,
          commentText: oauthState.commentText,
          ipAddress,
          userAgent,
        });

        if (!commentResult.success) {
          console.error('[SoundCloud Callback] Comment POST failed (non-critical):', commentResult.error);
        } else if (commentResult.posted) {
          console.log('[SoundCloud Callback] Comment posted successfully');
        }
      }

      // 6. Verify repost (if required)
      if (gate.requireSoundcloudRepost) {
        const verifyRepostUseCase = UseCaseFactory.createVerifySoundCloudRepostUseCase();

        const repostResult = await verifyRepostUseCase.execute({
          submissionId: oauthState.submissionId,
          accessToken: tokenResponse.access_token,
          soundcloudUserId: userProfile.id,
          ipAddress,
          userAgent,
        });

        if (!repostResult.success) {
          console.error('Repost verification failed:', repostResult.error);
          // Continue anyway - user can retry
        } else if (!repostResult.verified) {
          return redirectToGateWithError(
            'You have not reposted the track. Please repost and try again.',
            gate.slug
          );
        }
      }

      // 7. Verify follow (if required)
      if (gate.requireSoundcloudFollow) {
        const verifyFollowUseCase = UseCaseFactory.createVerifySoundCloudFollowUseCase();

        const followResult = await verifyFollowUseCase.execute({
          submissionId: oauthState.submissionId,
          accessToken: tokenResponse.access_token,
          soundcloudUserId: userProfile.id,
          ipAddress,
          userAgent,
        });

        if (!followResult.success) {
          console.error('Follow verification failed:', followResult.error);
          // Continue anyway - user can retry
        } else if (!followResult.verified) {
          return redirectToGateWithError(
            'You are not following the artist. Please follow and try again.',
            gate.slug
          );
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
