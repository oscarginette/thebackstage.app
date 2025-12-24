import { IMusicPlatformRepository } from '../repositories/IMusicPlatformRepository';
import { ITrackRepository } from '../repositories/ITrackRepository';
import { MusicTrack } from '../entities/MusicTrack';

export interface CheckNewTracksInput {
  userId: number;
  artistIdentifier: string;
  platform: 'soundcloud';
}

export interface CheckNewTracksResult {
  newTracksFound: number;
  tracks: Array<{
    id: string;
    title: string;
    url: string;
    coverImage: string | null;
    publishedAt: string;
  }>;
  latestTrack: {
    id: string;
    title: string;
    url: string;
    coverImage: string | null;
    publishedAt: string;
  } | null;
}

export class CheckNewTracksUseCase {
  constructor(
    private musicPlatformRepo: IMusicPlatformRepository,
    private trackRepo: ITrackRepository
  ) {}

  async execute(input: CheckNewTracksInput): Promise<CheckNewTracksResult> {
    // 1. Obtener última fecha de track guardado para este usuario
    const lastTrackDate = await this.getLastTrackDate(input.userId);

    // 2. Fetch tracks de la plataforma
    const newTracks = await this.musicPlatformRepo.getNewTracks(
      input.artistIdentifier,
      lastTrackDate
    );

    // 3. Filtrar tracks ya guardados para este usuario
    const unsavedTracks = await this.filterUnsavedTracks(newTracks, input.userId);

    // 4. Obtener el track más reciente de todos los tracks disponibles
    const allTracks = await this.musicPlatformRepo.fetchLatestTracks(input.artistIdentifier);
    const latestTrack = allTracks.length > 0 ? allTracks[0] : null;

    // 5. Retornar resultados
    return {
      newTracksFound: unsavedTracks.length,
      tracks: unsavedTracks.map(track => ({
        id: track.id,
        title: track.title,
        url: track.url,
        coverImage: track.coverImage,
        publishedAt: track.publishedAt.toISOString()
      })),
      latestTrack: latestTrack ? {
        id: latestTrack.id,
        title: latestTrack.title,
        url: latestTrack.url,
        coverImage: latestTrack.coverImage,
        publishedAt: latestTrack.publishedAt.toISOString()
      } : null
    };
  }

  private async getLastTrackDate(userId: number): Promise<Date> {
    const tracks = await this.trackRepo.findAll(userId);
    if (tracks.length === 0) {
      return new Date(0); // Epoch si no hay tracks
    }

    const dates = tracks.map(t => new Date(t.publishedAt));
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }

  private async filterUnsavedTracks(tracks: MusicTrack[], userId: number): Promise<MusicTrack[]> {
    const unsaved: MusicTrack[] = [];

    for (const track of tracks) {
      const exists = await this.trackRepo.existsByTrackId(track.id, userId);
      if (!exists) {
        unsaved.push(track);
      }
    }

    return unsaved;
  }
}
