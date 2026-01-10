import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * UpdateUserNotificationPreferencesUseCase
 *
 * Updates notification preferences for a user.
 * Validates input and ensures business rules are followed.
 */
export class UpdateUserNotificationPreferencesUseCase {
  constructor(
    private notificationPreferencesRepository: IUserNotificationPreferencesRepository
  ) {}

  async execute(
    userId: number,
    updates: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences> {
    // Validate input
    this.validateInput(updates);

    // Update preferences
    return this.notificationPreferencesRepository.update(userId, updates);
  }

  private validateInput(updates: {
    autoSendSoundcloud?: boolean;
    autoSendSpotify?: boolean;
  }): void {
    // Ensure at least one field is provided
    if (
      updates.autoSendSoundcloud === undefined &&
      updates.autoSendSpotify === undefined
    ) {
      throw new Error('At least one preference must be provided');
    }

    // Ensure values are booleans
    if (
      updates.autoSendSoundcloud !== undefined &&
      typeof updates.autoSendSoundcloud !== 'boolean'
    ) {
      throw new Error('autoSendSoundcloud must be a boolean');
    }

    if (
      updates.autoSendSpotify !== undefined &&
      typeof updates.autoSendSpotify !== 'boolean'
    ) {
      throw new Error('autoSendSpotify must be a boolean');
    }
  }
}
