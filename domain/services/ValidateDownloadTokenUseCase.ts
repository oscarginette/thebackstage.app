/**
 * ValidateDownloadTokenUseCase
 *
 * Validates download token before serving file.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify token exists in database
 * - Check token not expired
 * - Check token not already used (one-time use)
 * - Check gate still active
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (token validation)
 * - DIP: Depends on repository interfaces
 *
 * SECURITY: Validates all security constraints before download
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { DownloadToken } from '../value-objects/DownloadToken';
import {
  InvalidTokenError,
  ExpiredTokenError,
  TokenAlreadyUsedError,
  GateInactiveError,
  GateExpiredError,
} from '../errors/DownloadGateErrors';

export interface ValidateDownloadTokenInput {
  token: string; // Raw token string from URL
}

export interface ValidateDownloadTokenResult {
  valid: boolean;
  submissionId?: string;
  gateId?: string;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * ValidateDownloadTokenUseCase
 *
 * Security-focused validation before file download
 */
export class ValidateDownloadTokenUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Execute token validation
   * @param input - Raw token from URL
   * @returns Validation result with file URL if valid
   * @throws Domain errors if validation fails
   */
  async execute(input: ValidateDownloadTokenInput): Promise<ValidateDownloadTokenResult> {
    try {
      // 1. Find submission by token
      const submission = await this.submissionRepository.findByToken(input.token);

      if (!submission) {
        throw new InvalidTokenError('Download token not found');
      }

      // 2. Validate token using value object
      if (!submission.downloadToken || !submission.downloadTokenExpiresAt) {
        throw new InvalidTokenError('Download token not generated yet');
      }

      const tokenObj = DownloadToken.fromExisting(
        submission.downloadToken,
        submission.downloadTokenExpiresAt
      );

      if (tokenObj.isExpired()) {
        throw new ExpiredTokenError(
          'Download token has expired. Please request a new download link.'
        );
      }

      // 3. Check one-time use (not already downloaded)
      if (submission.downloadCompleted) {
        throw new TokenAlreadyUsedError(
          'This download token has already been used. Each token can only be used once.'
        );
      }

      // 4. Validate gate still active (security check)
      const gate = await this.gateRepository.findByIdPublic(submission.gateId);

      if (!gate) {
        throw new InvalidTokenError('Download gate not found');
      }

      if (!gate.isActive()) {
        if (gate.expiresAt && gate.expiresAt < new Date()) {
          throw new GateExpiredError('This download gate has expired');
        }
        throw new GateInactiveError('This download gate is no longer active');
      }

      // 5. Return validation success with file URL
      return {
        valid: true,
        submissionId: submission.id,
        gateId: gate.id,
        fileUrl: gate.fileUrl,
        fileName: gate.title || 'download',
      };
    } catch (error) {
      console.error('[ValidateDownloadTokenUseCase] Execute error:', error);

      // Re-throw domain errors
      if (
        error instanceof InvalidTokenError ||
        error instanceof ExpiredTokenError ||
        error instanceof TokenAlreadyUsedError ||
        error instanceof GateInactiveError ||
        error instanceof GateExpiredError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(
        error instanceof Error ? error.message : 'Failed to validate download token'
      );
    }
  }
}
