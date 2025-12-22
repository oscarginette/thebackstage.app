/**
 * CreateDownloadGateUseCase
 *
 * Handles download gate creation with validation and slug generation.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate slug uniqueness
 * - Generate slug from title if not provided
 * - Validate SoundCloud track URL format
 * - Validate required fields (title, fileUrl)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (gate creation)
 * - DIP: Depends on IDownloadGateRepository interface
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { DownloadGate } from '../entities/DownloadGate';
import { CreateGateInput } from '../types/download-gates';

export interface CreateDownloadGateResult {
  success: boolean;
  gate?: DownloadGate;
  error?: string;
}

export class CreateDownloadGateUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Execute gate creation
   * @param userId - User creating the gate
   * @param input - Gate creation data
   * @returns CreateDownloadGateResult with gate data or error
   */
  async execute(userId: number, input: CreateGateInput): Promise<CreateDownloadGateResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Generate slug if not provided
      const slug = input.slug || this.generateSlug(input.title);

      // 3. Check slug uniqueness
      const isAvailable = await this.gateRepository.isSlugAvailable(slug);
      if (!isAvailable) {
        return {
          success: false,
          error: `Slug "${slug}" is already taken. Please choose a different one.`,
        };
      }

      // 4. Create gate
      const gate = await this.gateRepository.create(userId, {
        ...input,
        slug,
      });

      return {
        success: true,
        gate,
      };
    } catch (error) {
      console.error('CreateDownloadGateUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create download gate',
      };
    }
  }

  /**
   * Generate URL-safe slug from title
   * @param title - Gate title
   * @returns URL-safe slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate gate input
   * @param input - Gate creation data
   * @returns Error message or null if valid
   */
  private validateInput(input: CreateGateInput): string | null {
    // Validate title
    if (!input.title || input.title.trim().length === 0) {
      return 'Title is required';
    }

    if (input.title.length > 200) {
      return 'Title must be 200 characters or less';
    }

    // Validate file URL
    if (!input.fileUrl || input.fileUrl.trim().length === 0) {
      return 'File URL is required';
    }

    // Basic URL validation
    try {
      new URL(input.fileUrl);
    } catch {
      return 'File URL must be a valid URL';
    }

    // Validate SoundCloud URL if provided
    if (input.soundcloudTrackId && input.soundcloudTrackId.trim().length > 0) {
      // SoundCloud track ID should be numeric
      if (!/^\d+$/.test(input.soundcloudTrackId)) {
        return 'SoundCloud track ID must be numeric';
      }
    }

    // Validate slug format if provided
    if (input.slug) {
      if (!/^[a-z0-9-]+$/.test(input.slug)) {
        return 'Slug must contain only lowercase letters, numbers, and hyphens';
      }

      if (input.slug.length < 3) {
        return 'Slug must be at least 3 characters long';
      }

      if (input.slug.length > 100) {
        return 'Slug must be 100 characters or less';
      }
    }

    // Validate max downloads if provided
    if (input.maxDownloads !== undefined && input.maxDownloads !== null) {
      if (input.maxDownloads < 1) {
        return 'Maximum downloads must be at least 1';
      }
    }

    // Validate expiration date if provided
    if (input.expiresAt) {
      if (input.expiresAt < new Date()) {
        return 'Expiration date must be in the future';
      }
    }

    return null;
  }
}
