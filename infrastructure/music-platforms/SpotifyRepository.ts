/**
 * SpotifyRepository
 *
 * Repository for fetching music tracks from Spotify.
 * Implements IMusicPlatformRepository interface.
 *
 * Clean Architecture: Infrastructure layer
 * SOLID: Dependency Inversion (implements domain interface)
 */

import { IMusicPlatformRepository } from '@/domain/repositories/IMusicPlatformRepository';
import { MusicTrack } from '@/domain/entities/MusicTrack';
import { SpotifyClient } from './SpotifyClient';

export class SpotifyRepository implements IMusicPlatformRepository {
  constructor(private client: SpotifyClient) {}

  /**
   * Fetch latest albums/singles for an artist
   *
   * @param artistId - Spotify artist ID
   * @returns Array of MusicTrack entities
   */
  async fetchLatestTracks(artistId: string): Promise<MusicTrack[]> {
    const albums = await this.client.fetchArtistAlbums(artistId, 10);

    return albums.map(album => {
      const parsed = this.client.parseAlbumData(album);
      return MusicTrack.fromSpotify(parsed);
    });
  }

  /**
   * Get new tracks released after a specific date
   *
   * @param artistId - Spotify artist ID
   * @param sinceDate - Filter releases after this date
   * @returns Array of new MusicTrack entities
   */
  async getNewTracks(artistId: string, sinceDate: Date): Promise<MusicTrack[]> {
    const allTracks = await this.fetchLatestTracks(artistId);
    return allTracks.filter(track => track.isNewSince(sinceDate));
  }
}
