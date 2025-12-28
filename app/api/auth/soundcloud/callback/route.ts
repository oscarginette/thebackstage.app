/**
 * GET /api/auth/soundcloud/callback
 * SoundCloud OAuth callback handler (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 *
 * Flow:
 * 1. Validate state token (CSRF protection)
 * 2. Exchange authorization code for access token
 * 3. Get SoundCloud user profile
 * 4. Update submission with SoundCloud profile
 * 5. Verify repost (if required by gate)
 * 6. Verify follow (if required by gate)
 * 7. Mark state token as used
 * 8. Redirect back to gate page with success/error
 *
 * Query Parameters:
 * - code: Authorization code from SoundCloud
 * - state: State token for CSRF protection
 * - error: OAuth error (if authorization failed)
 *
 * Security:
 * - State token validation (exists, not used, not expired)
 * - One-time use tokens
 * - Access token never exposed to browser
 */

import { NextResponse } from 'next/request';
import { PostgresOAuthStateRepository } from '@/infrastructure/database/repositories/PostgresOAuthStateRepository';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { soundCloudClient } from '@/lib/soundcloud-client';
import { VerifySoundCloudRepostUseCase } from '@/domain/services/VerifySoundCloudRepostUseCase';
import { VerifySoundCloudFollowUseCase } from '@/domain/services/VerifySoundCloudFollowUseCase';

// Singleton repository instances
const oauthStateRepository = new PostgresOAuthStateRepository();
const submissionRepository = new PostgresDownloadSubmissionRepository();
const gateRepository = new PostgresDownloadGateRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();

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

    // Get gate to construct redirect URL
    const gate = await gateRepository.findById(1, oauthState.gateId.toString());
    if (!gate) {
      return redirectToGateWithError('Gate not found', null);
    }

    try {
      // 2. Exchange code for access token
      const redirectUri =
        process.env.SOUNDCLOUD_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/soundcloud/callback`;

      const tokenResponse = await soundCloudClient.exchangeCodeForToken(
        code,
        redirectUri
      );

      // 3. Get SoundCloud user profile
      const userProfile = await soundCloudClient.getUserProfile(
        tokenResponse.access_token
      );

      // 4. Update submission with SoundCloud profile
      await submissionRepository.updateSoundCloudProfile(oauthState.submissionId, {
        userId: userProfile.id.toString(),
        username: userProfile.username,
        profileUrl: userProfile.permalink_url,
        avatarUrl: userProfile.avatar_url,
      });

      // Extract IP and user agent
      const ipAddress = request.headers.get('x-forwarded-for') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // 5. Verify repost (if required)
      if (gate.requireSoundcloudRepost) {
        const verifyRepostUseCase = new VerifySoundCloudRepostUseCase(
          submissionRepository,
          gateRepository,
          analyticsRepository,
          soundCloudClient
        );

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

      // 6. Verify follow (if required)
      if (gate.requireSoundcloudFollow) {
        const verifyFollowUseCase = new VerifySoundCloudFollowUseCase(
          submissionRepository,
          gateRepository,
          analyticsRepository,
          soundCloudClient
        );

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

      // 7. Mark state token as used
      await oauthStateRepository.markAsUsed(oauthState.id);

      // 8. Redirect back to gate page with success
      const gateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/gate/${gate.slug}?soundcloud=success`;
      return NextResponse.redirect(gateUrl);
    } catch (error) {
      console.error('SoundCloud callback processing error:', error);

      // Mark state as used to prevent retry attacks
      await oauthStateRepository.markAsUsed(oauthState.id);

      return redirectToGateWithError(
        error instanceof Error
          ? error.message
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (gateSlug) {
    const url = `${baseUrl}/gate/${gateSlug}?soundcloud=error&error=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(url);
  }

  // If we don't know the gate, redirect to home with error
  const url = `${baseUrl}?error=${encodeURIComponent(errorMessage)}`;
  return NextResponse.redirect(url);
}
