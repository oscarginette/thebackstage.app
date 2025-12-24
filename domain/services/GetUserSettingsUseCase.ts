/**
 * GetUserSettingsUseCase
 *
 * Business logic for retrieving user settings.
 * Single Responsibility: Only handles getting user settings.
 */
import { UserSettings } from '../entities/UserSettings';
import { IUserSettingsRepository } from '../repositories/IUserSettingsRepository';

export class GetUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  /**
   * Execute use case
   * @param userId - The authenticated user's ID
   * @returns UserSettings entity
   */
  async execute(userId: number): Promise<UserSettings> {
    return await this.userSettingsRepository.getByUserId(userId);
  }
}
