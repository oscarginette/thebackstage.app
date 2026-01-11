/**
 * TrackInstagramClickUseCase
 *
 * Tracks when a user clicks to visit an Instagram profile.
 * No OAuth verification (Instagram API doesn't support follow verification).
 *
 * Business Rules:
 * - Validate submission exists
 * - Validate submission belongs to gate
 * - Record click timestamp
 * - Idempotent (subsequent clicks don't overwrite timestamp)
 * - Track analytics event
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (Instagram click tracking)
 * - DIP: Depends on repository interfaces
 *
 * Clean Architecture: Domain layer with no external dependencies
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';

export interface TrackInstagramClickInput {
  submissionId: string; // UUID
  gateId: string; // UUID (for validation)
  ipAddress?: string;
  userAgent?: string;
}

export interface TrackInstagramClickResult {
  success: boolean;
  instagramUrl?: string; // URL to redirect to
  alreadyTracked?: boolean;
  error?: string;
}

export class TrackInstagramClickUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository
  ) {}

  /**
   * Execute Instagram click tracking
   * @param input - Click tracking input
   * @returns TrackInstagramClickResult with Instagram URL or error
   */
  async execute(input: TrackInstagramClickInput): Promise<TrackInstagramClickResult> {
    try {
      // 1. Find submission
      const submission = await this.submissionRepository.findById(input.submissionId);
      if (!submission) {
        return { success: false, error: 'Submission not found' };
      }

      // 2. Validate submission belongs to gate
      if (submission.gateId !== input.gateId) {
        return { success: false, error: 'Invalid submission for this gate' };
      }

      // 3. Find gate (public query, no userId needed)
      const gate = await this.gateRepository.findByIdPublic(input.gateId);
      if (!gate) {
        return { success: false, error: 'Download gate not found' };
      }

      // 4. Check gate requires Instagram
      if (!gate.requireInstagramFollow) {
        return { success: false, error: 'Instagram follow not required for this gate' };
      }

      // 5. Validate Instagram URL exists
      if (!gate.instagramProfileUrl) {
        return { success: false, error: 'Instagram URL not configured for this gate' };
      }

      // 6. Check if already tracked (idempotent)
      const alreadyTracked = submission.instagramClickTracked;

      // 7. Update submission (only if not already tracked)
      if (!alreadyTracked) {
        await this.submissionRepository.updateVerificationStatus(input.submissionId, {
          instagramClickTracked: true,
        });

        // 8. Track analytics event (non-blocking)
        this.trackAnalyticsEvent(input).catch(error => {
          console.error('Failed to track Instagram click analytics (non-critical):', error);
        });
      }

      return {
        success: true,
        instagramUrl: gate.instagramProfileUrl,
        alreadyTracked,
      };
    } catch (error) {
      console.error('TrackInstagramClickUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track Instagram click',
      };
    }
  }

  /**
   * Track analytics event for Instagram click
   * @param input - Click tracking input
   */
  private async trackAnalyticsEvent(input: TrackInstagramClickInput): Promise<void> {
    try {
      await this.analyticsRepository.track({
        gateId: input.gateId,
        eventType: 'submit', // Reuse existing event type
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (error) {
      console.error('Failed to track Instagram click event (non-critical):', error);
    }
  }
}
