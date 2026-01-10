import { sql } from '@vercel/postgres';
import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';
import type { NotificationPreferencesData } from '@/domain/types/notification-preferences';

/**
 * PostgreSQL implementation of notification preferences repository
 */
export class PostgresUserNotificationPreferencesRepository
  implements IUserNotificationPreferencesRepository
{
  /**
   * Get notification preferences for a user
   * Returns default preferences if none exist
   */
  async getByUserId(userId: number): Promise<UserNotificationPreferences> {
    const result = await sql`
      SELECT
        user_id as "userId",
        auto_send_soundcloud as "autoSendSoundcloud",
        auto_send_spotify as "autoSendSpotify",
        updated_at as "updatedAt"
      FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      // No preferences exist, return defaults
      return UserNotificationPreferences.createDefault(userId);
    }

    return UserNotificationPreferences.fromDatabase(
      result.rows[0] as NotificationPreferencesData
    );
  }

  /**
   * Update notification preferences (upsert)
   */
  async update(
    userId: number,
    preferences: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences> {
    const now = new Date();

    // Use INSERT ... ON CONFLICT for upsert
    const result = await sql`
      INSERT INTO user_notification_preferences (
        user_id,
        auto_send_soundcloud,
        auto_send_spotify,
        updated_at
      )
      VALUES (
        ${userId},
        ${preferences.autoSendSoundcloud ?? true},
        ${preferences.autoSendSpotify ?? true},
        ${now}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        auto_send_soundcloud = COALESCE(${preferences.autoSendSoundcloud}, user_notification_preferences.auto_send_soundcloud),
        auto_send_spotify = COALESCE(${preferences.autoSendSpotify}, user_notification_preferences.auto_send_spotify),
        updated_at = ${now}
      RETURNING
        user_id as "userId",
        auto_send_soundcloud as "autoSendSoundcloud",
        auto_send_spotify as "autoSendSpotify",
        updated_at as "updatedAt"
    `;

    return UserNotificationPreferences.fromDatabase(
      result.rows[0] as NotificationPreferencesData
    );
  }
}
