import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/soundcloud-tracks
 * Obtiene tracks de SoundCloud con estado de envío
 *
 * Clean Architecture: Only HTTP orchestration, no business logic
 */
export async function GET() {
  try {
    const session = await auth();
    console.log('[SoundCloud API] Session:', { userId: session?.user?.id, email: session?.user?.email });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's SoundCloud ID from settings
    const settingsUseCase = UseCaseFactory.createGetUserSettingsUseCase();
    const settings = await settingsUseCase.execute(parseInt(session.user.id));

    console.log('[SoundCloud API] Settings:', {
      soundcloudId: settings.soundcloudId,
      hasSoundCloudId: settings.hasSoundCloudId()
    });

    if (!settings.hasSoundCloudId()) {
      return NextResponse.json(
        { error: 'SoundCloud ID not configured. Please add it in Settings.' },
        { status: 400 }
      );
    }

    const useCase = UseCaseFactory.createGetSoundCloudTracksUseCase();

    const userId = parseInt(session.user.id);
    console.log('[SoundCloud API] Fetching tracks for:', { soundcloudId: settings.soundcloudId, userId });
    const tracks = await useCase.execute(settings.soundcloudId!, userId);
    console.log('[SoundCloud API] Tracks fetched:', tracks.length);

    return NextResponse.json({ tracks });

  } catch (error: unknown) {
    console.error('Error fetching SoundCloud tracks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
