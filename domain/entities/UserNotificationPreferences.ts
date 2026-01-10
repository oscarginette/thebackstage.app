import type { NotificationPreferencesData } from '@/domain/types/notification-preferences';

/**
 * UserNotificationPreferences Entity
 *
 * Represents user preferences for automatic email notifications.
 * Controls whether new tracks from SoundCloud/Spotify are auto-announced.
 *
 * Business Rules:
 * - Defaults to enabled (better engagement)
 * - Per-platform granularity (users can disable one, keep the other)
 * - Changes take effect immediately (no cron delay)
 */
export class UserNotificationPreferences {
  readonly userId: number;
  readonly autoSendSoundcloud: boolean;
  readonly autoSendSpotify: boolean;
  readonly updatedAt: Date;

  private constructor(data: NotificationPreferencesData) {
    this.userId = data.userId;
    this.autoSendSoundcloud = data.autoSendSoundcloud;
    this.autoSendSpotify = data.autoSendSpotify;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Factory: Create from database row
   */
  static fromDatabase(data: NotificationPreferencesData): UserNotificationPreferences {
    return new UserNotificationPreferences(data);
  }

  /**
   * Factory: Create default preferences for new user
   */
  static createDefault(userId: number): UserNotificationPreferences {
    return new UserNotificationPreferences({
      userId,
      autoSendSoundcloud: true,  // Enabled by default
      autoSendSpotify: true,     // Enabled by default
      updatedAt: new Date(),
    });
  }

  /**
   * Create updated preferences (immutable)
   */
  update(updates: {
    autoSendSoundcloud?: boolean;
    autoSendSpotify?: boolean;
  }): UserNotificationPreferences {
    return new UserNotificationPreferences({
      userId: this.userId,
      autoSendSoundcloud: updates.autoSendSoundcloud ?? this.autoSendSoundcloud,
      autoSendSpotify: updates.autoSendSpotify ?? this.autoSendSpotify,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object (for API responses)
   */
  toJSON() {
    return {
      userId: this.userId,
      autoSendSoundcloud: this.autoSendSoundcloud,
      autoSendSpotify: this.autoSendSpotify,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
