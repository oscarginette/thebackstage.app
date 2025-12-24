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

    if (!settings.hasSoundCloudId()) {
      return NextResponse.json(
        { error: 'SoundCloud ID not configured. Please add it in Settings.' },
        { status: 400 }
      );
    }

    const trackRepository = new PostgresTrackRepository();
    const soundCloudClient = new SoundCloudClient();
    const useCase = new GetSoundCloudTracksUseCase(trackRepository, soundCloudClient);

    const tracks = await useCase.execute(settings.soundcloudId!);

    return NextResponse.json({ tracks });

  } catch (error: any) {
    console.error('Error fetching SoundCloud tracks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
