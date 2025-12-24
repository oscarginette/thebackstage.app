/**
 * IUserSettingsRepository
 *
 * Repository interface for user settings (Dependency Inversion Principle).
 * Domain layer defines the contract, infrastructure implements it.
 */
import { UserSettings } from '../entities/UserSettings';

export interface UpdateUserSettingsInput {
  name?: string | null;
  soundcloudId?: string | null;
  spotifyId?: string | null;
}

export interface IUserSettingsRepository {
  /**
   * Get user settings by user ID
   * @throws NotFoundError if user doesn't exist
   */
  getByUserId(userId: number): Promise<UserSettings>;

  /**
   * Update user settings
   * @throws NotFoundError if user doesn't exist
   */
  update(userId: number, input: UpdateUserSettingsInput): Promise<UserSettings>;
}
