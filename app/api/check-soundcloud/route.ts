import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { getAppUrl } from '@/lib/env';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/check-soundcloud
 *
 * Multi-tenant cron endpoint that checks for new SoundCloud tracks for ALL users.
 * Orchestrates track checking and email sending across all users with SoundCloud configured.
 *
 * Clean Architecture: Only HTTP concerns (validation, JSON response).
 * Business logic delegated to CheckAllUsersSoundCloudReleasesUseCase.
 */
export async function GET() {
  try {
    const baseUrl = getAppUrl();

    // Create and execute use case
    const useCase = UseCaseFactory.createCheckAllUsersSoundCloudReleasesUseCase();
    const result = await useCase.execute({ baseUrl });

    // Return empty state if no users configured
    if (result.usersProcessed === 0) {
      return NextResponse.json({
        message: 'No users with SoundCloud configured',
        usersProcessed: 0,
      });
    }

    return NextResponse.json({
      success: result.success,
      usersProcessed: result.usersProcessed,
      totalEmailsSent: result.totalEmailsSent,
      totalNewTracks: result.totalNewTracks,
      results: result.results,
    });
  } catch (error: unknown) {
    console.error('Error in check-soundcloud:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
