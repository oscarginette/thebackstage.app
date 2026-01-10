/**
 * UserSettings Entity
 *
 * Represents user configuration and platform connections.
 * Immutable value object following Clean Architecture principles.
 */
export class UserSettings {
  constructor(
    public readonly userId: number,
    public readonly name: string | null,
    public readonly soundcloudId: string | null,
    public readonly soundcloudPermalink: string | null,
    public readonly spotifyId: string | null,
    public readonly instagramUrl: string | null,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if user has valid SoundCloud ID configured
   */
  hasSoundCloudId(): boolean {
    return !!this.soundcloudId && this.soundcloudId.trim().length > 0;
  }

  /**
   * Check if user has valid Spotify ID configured
   */
  hasSpotifyId(): boolean {
    return !!this.spotifyId && this.spotifyId.trim().length > 0;
  }

  /**
   * Check if user has valid Instagram URL configured
   */
  hasInstagramUrl(): boolean {
    return !!this.instagramUrl && this.instagramUrl.trim().length > 0;
  }

  /**
   * Create a copy with updated fields
   */
  update(updates: Partial<{
    name: string | null;
    soundcloudId: string | null;
    soundcloudPermalink: string | null;
    spotifyId: string | null;
    instagramUrl: string | null;
  }>): UserSettings {
    return new UserSettings(
      this.userId,
      updates.name !== undefined ? updates.name : this.name,
      updates.soundcloudId !== undefined ? updates.soundcloudId : this.soundcloudId,
      updates.soundcloudPermalink !== undefined ? updates.soundcloudPermalink : this.soundcloudPermalink,
      updates.spotifyId !== undefined ? updates.spotifyId : this.spotifyId,
      updates.instagramUrl !== undefined ? updates.instagramUrl : this.instagramUrl,
      new Date()
    );
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      userId: this.userId,
      name: this.name,
      soundcloudId: this.soundcloudId,
      soundcloudPermalink: this.soundcloudPermalink,
      spotifyId: this.spotifyId,
      instagramUrl: this.instagramUrl,
      hasSoundCloudId: this.hasSoundCloudId(),
      hasSpotifyId: this.hasSpotifyId(),
      hasInstagramUrl: this.hasInstagramUrl(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
