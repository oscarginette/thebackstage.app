/**
 * IMusicPlatformClient
 *
 * Interface for music platform API clients (SoundCloud, Spotify, etc.)
 *
 * Clean Architecture: Domain layer interface.
 * SOLID Compliance:
 * - Dependency Inversion Principle (DIP): Domain depends on abstraction
 * - Open/Closed Principle (OCP): Easy to add new music platforms
 * - Interface Segregation Principle (ISP): Small, focused interface
 */

export interface IMusicPlatformClient {
  /**
   * Fetch tracks from the music platform
   * @param artistIdentifier - Artist ID or username
   * @returns Array of raw track data from platform API
   */
  fetchTracks(artistIdentifier: string): Promise<any[]>;

  /**
   * Parse raw platform data into normalized format
   * @param rawData - Raw track data from platform API
   * @returns Normalized track data
   */
  parseTrackData(rawData: any): any;
}
