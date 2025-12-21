import { IMusicPlatformRepository } from '@/domain/repositories/IMusicPlatformRepository';
import { MusicTrack } from '@/domain/entities/MusicTrack';
import { SoundCloudClient } from './SoundCloudClient';

export class SoundCloudRepository implements IMusicPlatformRepository {
  constructor(private client: SoundCloudClient) {}

  async fetchLatestTracks(userId: string): Promise<MusicTrack[]> {
    const rawTracks = await this.client.fetchTracks(userId);

    return rawTracks.map(track => {
      const parsed = this.client.parseTrackData(track);
      return MusicTrack.fromSoundCloudRSS(parsed);
    });
  }

  async getNewTracks(userId: string, sinceDate: Date): Promise<MusicTrack[]> {
    const allTracks = await this.fetchLatestTracks(userId);
    return allTracks.filter(track => track.isNewSince(sinceDate));
  }
}
