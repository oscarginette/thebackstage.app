/**
 * GenerateDownloadTokenUseCase
 *
 * Generates a secure download token when all verifications are complete.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify submission exists
 * - Check all required verifications completed (Phase 1: email only)
 * - Check gate not expired or max downloads reached
 * - Generate secure token using crypto
 * - Set expiry (24h from now)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (token generation)
 * - DIP: Depends on repository interfaces
 *
 * SECURITY: Uses crypto.randomBytes for secure token generation
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { randomBytes } from 'crypto';

export interface GenerateDownloadTokenInput {
  submissionId: number;
}

export interface GenerateDownloadTokenResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export class GenerateDownloadTokenUseCase {
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Execute token generation
   * @param input - Submission ID
   * @returns GenerateDownloadTokenResult with token or error
   */
  async execute(input: GenerateDownloadTokenInput): Promise<GenerateDownloadTokenResult> {
    try {
      // 1. Find submission
      const submission = await this.submissionRepository.findById(input.submissionId);
      if (!submission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      // 2. Check if token already exists and is still valid
      if (submission.downloadToken && submission.downloadTokenExpiresAt) {
        if (submission.downloadTokenExpiresAt > new Date()) {
          // Return existing valid token
          return {
            success: true,
            token: submission.downloadToken,
            expiresAt: submission.downloadTokenExpiresAt,
          };
        }
      }

      // 3. Find gate
      const gate = await this.gateRepository.findBySlug(''); // TODO: Need to store gateId in submission
      // For now, we'll use findById with gateId from submission
      // This is a temporary workaround - will be fixed when repository is implemented

      // 4. Check gate is still active
      // Note: This validation will be implemented once we have proper gate lookup

      // 5. Verify all required verifications are complete
      const verificationsComplete = this.checkVerificationsComplete(submission);
      if (!verificationsComplete.complete) {
        return {
          success: false,
          error: verificationsComplete.error,
        };
      }

      // 6. Check max downloads not reached
      // Note: This check will be implemented in Phase 2

      // 7. Generate secure token
      const token = this.generateSecureToken();

      // 8. Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // 9. Save token to submission
      await this.submissionRepository.generateDownloadToken(input.submissionId, expiresAt);

      return {
        success: true,
        token,
        expiresAt,
      };
    } catch (error) {
      console.error('GenerateDownloadTokenUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download token',
      };
    }
  }

  /**
   * Check if all required verifications are complete
   * Phase 1: Only email verification required
   * Phase 2: Will add SoundCloud/Spotify checks
   * @param submission - Download submission
   * @returns Verification status
   */
  private checkVerificationsComplete(submission: any): {
    complete: boolean;
    error?: string;
  } {
    // Phase 1: Email verification
    // Note: Email is verified when submission is created (no separate verification step)
    // This is a simplified flow for MVP

    // Check if submission exists (basic validation)
    if (!submission.email) {
      return {
        complete: false,
        error: 'Email verification required',
      };
    }

    // TODO: Phase 2 - Add checks for:
    // - SoundCloud repost verification
    // - SoundCloud follow verification
    // - Spotify connect verification

    return { complete: true };
  }

  /**
   * Generate cryptographically secure random token
   * @returns Hex-encoded secure token
   */
  private generateSecureToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }
}
