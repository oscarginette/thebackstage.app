import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * Repository interface for notification preferences
 * Follows Dependency Inversion Principle (DIP)
 */
export interface IUserNotificationPreferencesRepository {
  /**
   * Get notification preferences for a user
   * Returns default preferences if none exist
   */
  getByUserId(userId: number): Promise<UserNotificationPreferences>;

  /**
   * Update notification preferences
   * Creates preferences if they don't exist (upsert)
   */
  update(
    userId: number,
    preferences: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences>;
}
