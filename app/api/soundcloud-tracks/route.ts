import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetSoundCloudTracksUseCase } from '@/domain/services/GetSoundCloudTracksUseCase';
import { PostgresTrackRepository } from '@/infrastructure/database/repositories/PostgresTrackRepository';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import { SoundCloudClient } from '@/infrastructure/music-platforms/SoundCloudClient';

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
    const settingsRepository = new PostgresUserSettingsRepository();
    const settingsUseCase = new GetUserSettingsUseCase(settingsRepository);
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

    const trackRepository = new PostgresTrackRepository();
    const soundCloudClient = new SoundCloudClient();
    const useCase = new GetSoundCloudTracksUseCase(trackRepository, soundCloudClient);

    const userId = parseInt(session.user.id);
    console.log('[SoundCloud API] Fetching tracks for:', { soundcloudId: settings.soundcloudId, userId });
    const tracks = await useCase.execute(settings.soundcloudId!, userId);
    console.log('[SoundCloud API] Tracks fetched:', tracks.length);

    return NextResponse.json({ tracks });

  } catch (error: any) {
    console.error('Error fetching SoundCloud tracks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
