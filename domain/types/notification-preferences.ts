/**
 * Auto-send notification types
 * Controls automatic email announcements for new content
 */
export type NotificationPreferenceType =
  | 'soundcloud_auto_send'
  | 'spotify_auto_send';

/**
 * Typed constants for notification preferences
 * ALWAYS use these instead of string literals
 */
export const NOTIFICATION_PREFERENCES = {
  SOUNDCLOUD_AUTO_SEND: 'soundcloud_auto_send' as const,
  SPOTIFY_AUTO_SEND: 'spotify_auto_send' as const,
} as const;

/**
 * User notification preferences
 */
export interface NotificationPreferencesData {
  userId: number;
  autoSendSoundcloud: boolean;
  autoSendSpotify: boolean;
  updatedAt: Date;
}
