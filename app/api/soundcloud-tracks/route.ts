import { NextResponse } from 'next/server';
import { GetSoundCloudTracksUseCase } from '@/domain/services/GetSoundCloudTracksUseCase';
import { PostgresTrackRepository } from '@/infrastructure/database/repositories/PostgresTrackRepository';
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
    const soundCloudUserId = process.env.SOUNDCLOUD_USER_ID;

    if (!soundCloudUserId) {
      return NextResponse.json(
        { error: 'SOUNDCLOUD_USER_ID not configured' },
        { status: 500 }
      );
    }

    const trackRepository = new PostgresTrackRepository();
    const soundCloudClient = new SoundCloudClient();
    const useCase = new GetSoundCloudTracksUseCase(trackRepository, soundCloudClient);

    const tracks = await useCase.execute(soundCloudUserId);

    return NextResponse.json({ tracks });

  } catch (error: any) {
    console.error('Error fetching SoundCloud tracks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
