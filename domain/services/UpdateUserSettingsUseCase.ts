/**
 * UpdateUserSettingsUseCase
 *
 * Business logic for updating user settings.
 * Single Responsibility: Only handles updating user settings.
 */
import { UserSettings } from '../entities/UserSettings';
import { IUserSettingsRepository, UpdateUserSettingsInput } from '../repositories/IUserSettingsRepository';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UpdateUserSettingsUseCase {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  /**
   * Execute use case
   * @param userId - The authenticated user's ID
   * @param input - Fields to update
   * @returns Updated UserSettings entity
   */
  async execute(userId: number, input: UpdateUserSettingsInput): Promise<UserSettings> {
    this.validateInput(input);

    return await this.userSettingsRepository.update(userId, input);
  }

  /**
   * Validate input data
   */
  private validateInput(input: UpdateUserSettingsInput): void {
    // Validate name if provided
    if (input.name !== undefined && input.name !== null) {
      if (input.name.trim().length === 0) {
        throw new ValidationError('Name cannot be empty');
      }
      if (input.name.length > 255) {
        throw new ValidationError('Name is too long (max 255 characters)');
      }
    }

    // Validate SoundCloud ID if provided
    if (input.soundcloudId !== undefined && input.soundcloudId !== null) {
      if (input.soundcloudId.trim().length === 0) {
        throw new ValidationError('SoundCloud ID cannot be empty');
      }
      if (input.soundcloudId.length > 255) {
        throw new ValidationError('SoundCloud ID is too long (max 255 characters)');
      }
    }

    // Validate Spotify ID if provided
    if (input.spotifyId !== undefined && input.spotifyId !== null) {
      if (input.spotifyId.trim().length === 0) {
        throw new ValidationError('Spotify ID cannot be empty');
      }
      if (input.spotifyId.length > 255) {
        throw new ValidationError('Spotify ID is too long (max 255 characters)');
      }
    }
  }
}
