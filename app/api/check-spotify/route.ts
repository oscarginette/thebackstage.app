import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { getAppUrl } from '@/lib/env';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/check-spotify
 *
 * Multi-tenant endpoint that checks for new Spotify releases for ALL users with Spotify configured.
 * Orchestration delegated to CheckAllUsersSpotifyReleasesUseCase.
 *
 * Clean Architecture: Only HTTP concerns (URL config, JSON response)
 * Business logic delegated to use case in domain layer
 */
export async function GET() {
  try {
    const baseUrl = getAppUrl();

    // Get use case from DI container
    const useCase = UseCaseFactory.createCheckAllUsersSpotifyReleasesUseCase();

    // Execute use case
    const result = await useCase.execute({ baseUrl });

    // Return result
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Check Spotify Route] Unexpected error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
