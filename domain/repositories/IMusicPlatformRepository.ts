import { MusicTrack } from '../entities/MusicTrack';

export interface IMusicPlatformRepository {
  fetchLatestTracks(artistIdentifier: string): Promise<MusicTrack[]>;
  getNewTracks(artistIdentifier: string, sinceDate: Date): Promise<MusicTrack[]>;
}
