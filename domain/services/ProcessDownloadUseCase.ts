/**
 * ProcessDownloadUseCase
 *
 * Processes a download request using a download token.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate token exists
 * - Check token not expired
 * - Check token not already used
 * - Mark download as completed
 * - Increment gate download count
 * - Track analytics event (download)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (download processing)
 * - DIP: Depends on repository interfaces
 *
 * SECURITY: One-time use tokens, expiry validation
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';

export interface ProcessDownloadInput {
  downloadToken: string;
}

export interface ProcessDownloadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export class ProcessDownloadUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository
  ) {}

  /**
   * Execute download processing
   * @param input - Download token
   * @returns ProcessDownloadResult with file URL or error
   */
  async execute(input: ProcessDownloadInput): Promise<ProcessDownloadResult> {
    try {
      // 1. Validate token format
      if (!input.downloadToken || input.downloadToken.trim().length === 0) {
        return {
          success: false,
          error: 'Download token is required',
        };
      }

      // 2. Find submission by token
      const submission = await this.submissionRepository.findByToken(input.downloadToken);
      if (!submission) {
        return {
          success: false,
          error: 'Invalid download token',
        };
      }

      // 3. Check token not expired
      if (submission.downloadTokenExpiresAt) {
        if (submission.downloadTokenExpiresAt < new Date()) {
          return {
            success: false,
            error: 'Download token has expired. Please request a new download link.',
          };
        }
      }

      // 4. Check download not already completed (one-time use)
      if (submission.downloadCompleted) {
        return {
          success: false,
          error: 'This download token has already been used',
        };
      }

      // 5. Find gate to get file URL
      const gate = await this.gateRepository.findBySlug(''); // TODO: Need proper gate lookup
      // For now, we'll return error if gate not found
      // This will be fixed when we properly link submission to gate

      if (!gate) {
        return {
          success: false,
          error: 'Download gate not found',
        };
      }

      // 6. Mark download as completed
      await this.submissionRepository.markDownloadComplete(parseInt(submission.id));

      // 7. Increment gate download count
      await this.gateRepository.incrementDownloadCount(gate.id);

      // 8. Track analytics event
      await this.trackDownloadEvent(gate.id);

      // 9. Return file URL
      return {
        success: true,
        fileUrl: gate.fileUrl,
      };
    } catch (error) {
      console.error('ProcessDownloadUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process download',
      };
    }
  }

  /**
   * Track download analytics event
   * @param gateId - Gate ID
   */
  private async trackDownloadEvent(gateId: string): Promise<void> {
    try {
      await this.analyticsRepository.track({
        gateId: parseInt(gateId),
        eventType: 'download',
      });
    } catch (error) {
      // Non-critical error: download succeeds even if analytics tracking fails
      console.error('Failed to track download event (non-critical):', error);
    }
  }
}
