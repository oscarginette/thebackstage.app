/**
 * GET /api/auth/soundcloud
 * Initiate SoundCloud OAuth flow (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, state management via repository.
 *
 * Flow:
 * 1. Validate submissionId and gateId query parameters
 * 2. Create OAuth state token (CSRF protection)
 * 3. Redirect to SoundCloud authorization URL
 *
 * Query Parameters:
 * - submissionId: Download submission ID
 * - gateId: Download gate ID
 *
 * Security:
 * - State token prevents CSRF attacks
 * - State expires in 15 minutes
 * - State can only be used once
 */

import { NextResponse } from 'next/server';
import { PostgresOAuthStateRepository } from '@/infrastructure/database/repositories/PostgresOAuthStateRepository';
import { soundCloudClient } from '@/lib/soundcloud-client';

// Singleton repository instance
const oauthStateRepository = new PostgresOAuthStateRepository();

// OAuth state expiration: 15 minutes
const STATE_EXPIRATION_MS = 15 * 60 * 1000;

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/soundcloud
 * Redirect to SoundCloud OAuth authorization
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('submissionId');
    const gateId = url.searchParams.get('gateId');

    // Validate required parameters
    if (!submissionId || !gateId) {
      return NextResponse.json(
        { error: 'submissionId and gateId are required' },
        { status: 400 }
      );
    }

    const submissionIdNum = parseInt(submissionId, 10);
    const gateIdNum = parseInt(gateId, 10);

    if (isNaN(submissionIdNum) || isNaN(gateIdNum)) {
      return NextResponse.json(
        { error: 'Invalid submissionId or gateId' },
        { status: 400 }
      );
    }

    // Check SoundCloud client is configured
    if (!soundCloudClient.isConfigured()) {
      console.error('SoundCloud OAuth not configured');
      return NextResponse.json(
        { error: 'SoundCloud authentication is not configured' },
        { status: 500 }
      );
    }

    // Create OAuth state token (CSRF protection)
    const expiresAt = new Date(Date.now() + STATE_EXPIRATION_MS);

    const oauthState = await oauthStateRepository.create({
      provider: 'soundcloud',
      submissionId: submissionIdNum,
      gateId: gateIdNum,
      expiresAt,
    });

    // Get redirect URI from environment
    const redirectUri =
      process.env.SOUNDCLOUD_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/soundcloud/callback`;

    // Generate SoundCloud authorization URL
    const authUrl = soundCloudClient.getAuthorizationUrl(
      oauthState.stateToken,
      redirectUri
    );

    // Redirect to SoundCloud
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('GET /api/auth/soundcloud error:', error);

    return NextResponse.json(
      { error: 'Failed to initiate SoundCloud authentication' },
      { status: 500 }
    );
  }
}
