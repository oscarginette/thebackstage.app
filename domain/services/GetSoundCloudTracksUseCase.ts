import { ITrackRepository } from '../repositories/ITrackRepository';
import { IMusicPlatformClient } from '@/infrastructure/music-platforms/IMusicPlatformClient';

export interface SoundCloudTrackDTO {
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  coverImage: string | null;
  description: string | null;
  alreadySent: boolean;
}

/**
 * GetSoundCloudTracksUseCase
 *
 * Fetches SoundCloud tracks from RSS feed and marks which have been sent via email.
 * Follows Clean Architecture and SOLID principles.
 *
 * SRP: Only responsible for orchestrating track fetching with sent status
 * DIP: Depends on ITrackRepository and IMusicPlatformClient interfaces
 *
 * Business Logic:
 * - Fetch tracks from SoundCloud RSS via music platform client
 * - Query database for sent track IDs
 * - Mark each track with alreadySent status
 * - Return formatted track list for UI display
 */
export class GetSoundCloudTracksUseCase {
  constructor(
    private trackRepository: ITrackRepository,
    private soundCloudClient: IMusicPlatformClient
  ) {}

  /**
   * Executes the use case to retrieve SoundCloud tracks with sent status
   *
   * @param soundCloudUserId - The SoundCloud user ID to fetch tracks for
   * @param userId - The internal user ID for multi-tenant support
   * @returns Promise with array of tracks including sent status
   */
  async execute(soundCloudUserId: string, userId: number): Promise<SoundCloudTrackDTO[]> {
    const [rawTracks, sentTrackIds] = await Promise.all([
      this.fetchTracksFromSoundCloud(soundCloudUserId),
      this.trackRepository.getAllTrackIds(userId)
    ]);

    return this.formatTracksWithSentStatus(rawTracks, sentTrackIds);
  }

  /**
   * Fetches tracks from SoundCloud RSS feed
   * Handles errors gracefully and returns empty array on failure
   */
  private async fetchTracksFromSoundCloud(userId: string): Promise<any[]> {
    try {
      return await this.soundCloudClient.fetchTracks(userId);
    } catch (error) {
      console.error('Failed to fetch SoundCloud tracks:', error);
      return [];
    }
  }

  /**
   * Formats raw RSS track data into DTOs with sent status
   * Extracts relevant fields from RSS items
   */
  private formatTracksWithSentStatus(
    rawTracks: any[],
    sentTrackIds: Set<string>
  ): SoundCloudTrackDTO[] {
    return rawTracks.map(item => {
      const trackId = item.guid || item.link;
      return {
        trackId,
        title: item.title || 'Sin título',
        url: item.link || '',
        publishedAt: item.pubDate || new Date().toISOString(),
        coverImage: item.itunes?.image || item.enclosure?.url || null,
        description: item.contentSnippet || item.content || null,
        alreadySent: trackId ? sentTrackIds.has(trackId) : false
      };
    });
  }
}
