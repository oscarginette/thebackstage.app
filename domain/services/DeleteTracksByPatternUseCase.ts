/**
 * DeleteTracksByPatternUseCase
 *
 * Deletes tracks matching a title pattern.
 * Used for admin/test data cleanup operations.
 *
 * Clean Architecture: Business logic isolated from database concerns.
 * SOLID: Single Responsibility (only handles track deletion by pattern).
 *
 * SECURITY NOTE: This is an admin-only operation. Caller must verify authorization.
 */

import { ITrackRepository } from '@/domain/repositories/ITrackRepository';

export interface DeleteTracksByPatternInput {
  titlePattern: string;
}

export interface DeleteTracksByPatternResult {
  success: boolean;
  message: string;
  deletedCount?: number;
}

/**
 * DeleteTracksByPatternUseCase
 *
 * Deletes all tracks whose title matches the provided SQL LIKE pattern.
 */
export class DeleteTracksByPatternUseCase {
  constructor(private trackRepository: ITrackRepository) {}

  /**
   * Execute the use case
   *
   * @param input - Contains titlePattern (SQL LIKE pattern)
   * @returns Result with deletion count
   */
  async execute(
    input: DeleteTracksByPatternInput
  ): Promise<DeleteTracksByPatternResult> {
    // Validate input
    if (!input.titlePattern || input.titlePattern.trim() === '') {
      throw new Error('Title pattern is required');
    }

    // Delete tracks matching pattern
    const deletedCount = await this.trackRepository.deleteByTitlePattern(
      input.titlePattern
    );

    return {
      success: true,
      message:
        deletedCount > 0
          ? `${deletedCount} track(s) deleted`
          : 'No tracks matched the pattern',
      deletedCount,
    };
  }
}
