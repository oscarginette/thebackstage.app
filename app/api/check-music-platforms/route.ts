import { NextResponse } from 'next/server';
import { CheckAllMusicPlatformsUseCase } from '@/domain/services/CheckAllMusicPlatformsUseCase';
import {
  trackRepository,
  contactRepository,
  executionLogRepository,
  userRepository,
} from '@/infrastructure/database/repositories';
import { soundCloudRepository, spotifyRepository } from '@/infrastructure/music-platforms';
import { resendEmailProvider } from '@/infrastructure/email';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/check-music-platforms
 *
 * Unified endpoint that checks ALL music platforms (SoundCloud + Spotify) for new releases.
 * Orchestrates multi-platform checks for all active users.
 *
 * This is the main cron job endpoint (cost-efficient, single invocation).
 *
 * Clean Architecture: HTTP layer only orchestrates, business logic in use case
 * SOLID: Single endpoint orchestrates multiple platforms (SRP)
 *
 * Benefits:
 * - 50% cost reduction (single cron vs multiple)
 * - Centralized monitoring and logging
 * - Comprehensive reporting across platforms
 * - Failure isolation (one platform failure doesn't stop others)
 */
export async function GET() {
  try {
    const baseUrl =
      getAppUrl();

    console.log('[API] Starting unified music platforms check...');

    // Initialize use case with all repositories
    const useCase = new CheckAllMusicPlatformsUseCase(
      soundCloudRepository,
      spotifyRepository,
      contactRepository,
      resendEmailProvider,
      trackRepository,
      executionLogRepository,
      userRepository,
      baseUrl
    );

    // Execute multi-platform check
    const result = await useCase.execute();

    console.log('[API] Unified check completed:', {
      usersProcessed: result.usersProcessed,
      totalEmailsSent: result.totalEmailsSent,
      totalNewTracks: result.totalNewTracks,
      platformResults: result.platformResults,
    });

    return NextResponse.json({
      ...result,
      message: 'Multi-platform check completed',
    });

  } catch (error: unknown) {
    console.error('[API] Error in check-music-platforms:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check music platforms',
      },
      { status: 500 }
    );
  }
}
