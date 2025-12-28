/**
 * UpdateDownloadGateUseCase
 *
 * Updates an existing download gate with validation.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify user owns gate
 * - Validate slug uniqueness if changed
 * - Prevent changing slug if gate has submissions (data integrity)
 * - Validate SoundCloud URL if provided
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (gate update)
 * - DIP: Depends on repository interfaces
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { DownloadGate } from '../entities/DownloadGate';
import { CreateGateInput } from '../types/download-gates';

export interface UpdateDownloadGateResult {
  success: boolean;
  gate?: DownloadGate;
  error?: string;
}

export class UpdateDownloadGateUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly submissionRepository: IDownloadSubmissionRepository
  ) {}

  /**
   * Execute gate update
   * @param userId - User updating the gate
   * @param gateId - Gate ID to update
   * @param input - Partial gate data to update
   * @returns UpdateDownloadGateResult with updated gate or error
   */
  async execute(
    userId: number,
    gateId: string,
    input: Partial<CreateGateInput>
  ): Promise<UpdateDownloadGateResult> {
    try {
      // 1. Verify gate exists and user owns it
      const existingGate = await this.gateRepository.findById(userId, gateId);
      if (!existingGate) {
        return {
          success: false,
          error: 'Gate not found or access denied',
        };
      }

      // 2. Validate input
      const validationError = await this.validateInput(gateId, existingGate, input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 3. Update gate
      const updatedGate = await this.gateRepository.update(userId, gateId, input);

      return {
        success: true,
        gate: updatedGate,
      };
    } catch (error) {
      console.error('UpdateDownloadGateUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update download gate',
      };
    }
  }

  /**
   * Validate update input
   * @param gateId - Gate ID being updated
   * @param existingGate - Existing gate data
   * @param input - Update data
   * @returns Error message or null if valid
   */
  private async validateInput(
    gateId: string,
    existingGate: DownloadGate,
    input: Partial<CreateGateInput>
  ): Promise<string | null> {
    // Validate title if provided
    if (input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        return 'Title cannot be empty';
      }

      if (input.title.length > 200) {
        return 'Title must be 200 characters or less';
      }
    }

    // Validate file URL if provided
    if (input.fileUrl !== undefined) {
      if (!input.fileUrl || input.fileUrl.trim().length === 0) {
        return 'File URL cannot be empty';
      }

      try {
        new URL(input.fileUrl);
      } catch {
        return 'File URL must be a valid URL';
      }
    }

    // Validate slug if changed
    if (input.slug !== undefined && input.slug !== existingGate.slug) {
      // Check if gate has submissions
      const submissions = await this.submissionRepository.findAllByGate(gateId);
      if (submissions.length > 0) {
        return 'Cannot change slug after gate has received submissions (data integrity)';
      }

      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(input.slug)) {
        return 'Slug must contain only lowercase letters, numbers, and hyphens';
      }

      if (input.slug.length < 3) {
        return 'Slug must be at least 3 characters long';
      }

      if (input.slug.length > 100) {
        return 'Slug must be 100 characters or less';
      }

      // Check slug uniqueness
      const isAvailable = await this.gateRepository.isSlugAvailable(input.slug, gateId);
      if (!isAvailable) {
        return `Slug "${input.slug}" is already taken. Please choose a different one.`;
      }
    }

    // Validate SoundCloud track ID if provided
    if (input.soundcloudTrackId !== undefined && input.soundcloudTrackId) {
      if (!/^\d+$/.test(input.soundcloudTrackId)) {
        return 'SoundCloud track ID must be numeric';
      }
    }

    // Validate max downloads if provided
    if (input.maxDownloads !== undefined && input.maxDownloads !== null) {
      if (input.maxDownloads < 1) {
        return 'Maximum downloads must be at least 1';
      }
    }

    // Validate expiration date if provided
    if (input.expiresAt !== undefined && input.expiresAt !== null) {
      if (input.expiresAt < new Date()) {
        return 'Expiration date must be in the future';
      }
    }

    return null;
  }
}
