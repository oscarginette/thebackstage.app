import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * GetUserNotificationPreferencesUseCase
 *
 * Fetches notification preferences for a user.
 * Returns default preferences if none exist.
 */
export class GetUserNotificationPreferencesUseCase {
  constructor(
    private notificationPreferencesRepository: IUserNotificationPreferencesRepository
  ) {}

  async execute(userId: number): Promise<UserNotificationPreferences> {
    return this.notificationPreferencesRepository.getByUserId(userId);
  }
}
