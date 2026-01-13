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
import { IPixelTrackingService } from '../repositories/IPixelTrackingService';
import { PIXEL_EVENTS } from '../types/pixel-tracking';
import { TrackPixelEventUseCase } from './TrackPixelEventUseCase';
import {
  InvalidTokenError,
  ExpiredTokenError,
  TokenAlreadyUsedError,
  GateInactiveError,
  GateExpiredError,
} from '../errors/DownloadGateErrors';
import { DownloadGate } from '../entities/DownloadGate';

export interface ProcessDownloadInput {
  downloadToken: string;
}

export interface ProcessDownloadResult {
  success: boolean;
  fileUrl: string;
}

export class ProcessDownloadUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly pixelTrackingService?: IPixelTrackingService
  ) {}

  /**
   * Execute download processing
   * @param input - Download token
   * @returns ProcessDownloadResult with file URL
   * @throws Domain errors if validation fails
   */
  async execute(input: ProcessDownloadInput): Promise<ProcessDownloadResult> {
    // 1. Validate token format
    if (!input.downloadToken || input.downloadToken.trim().length === 0) {
      throw new InvalidTokenError('Download token is required');
    }

    // 2. Find submission by token
    const submission = await this.submissionRepository.findByToken(input.downloadToken);
    if (!submission) {
      throw new InvalidTokenError('Invalid download token');
    }

    // 3. Check token not expired
    if (submission.downloadTokenExpiresAt) {
      if (submission.downloadTokenExpiresAt < new Date()) {
        throw new ExpiredTokenError('Download token has expired. Please request a new download link.');
      }
    }

    // 4. Check download not already completed (one-time use)
    if (submission.downloadCompleted) {
      throw new TokenAlreadyUsedError('This download token has already been used');
    }

    // 5. Find gate to get file URL using gateId from submission
    const gate = await this.gateRepository.findByIdPublic(submission.gateId);

    if (!gate) {
      throw new InvalidTokenError('Download gate not found');
    }

    // Validate gate is still active
    if (!gate.active) {
      throw new GateInactiveError('This download gate is no longer active');
    }

    // Check gate not expired
    if (gate.expiresAt && gate.expiresAt < new Date()) {
      throw new GateExpiredError('This download gate has expired');
    }

    // 6. Mark download as completed
    await this.submissionRepository.markDownloadComplete(submission.id);

    // 7. Increment gate download count
    await this.gateRepository.incrementDownloadCount(gate.id);

    // 8. Track analytics event
    const analyticsEventId = await this.trackDownloadEvent(gate.id);

    // 9. Fire pixel tracking (fire-and-forget, non-blocking)
    if (gate.pixelConfig && this.pixelTrackingService && analyticsEventId) {
      this.trackPixelEvent(gate, submission, analyticsEventId).catch(error => {
        console.error('[PixelTracking] Failed (non-critical):', error);
      });
    }

    // 10. Return file URL (domain entity with camelCase)
    return {
      success: true,
      fileUrl: gate.fileUrl,
    };
  }

  /**
   * Track download analytics event
   * @param gateId - Gate ID
   * @returns Analytics event ID for pixel tracking deduplication, or null if tracking fails
   */
  private async trackDownloadEvent(gateId: string): Promise<string | null> {
    try {
      return await this.analyticsRepository.track({
        gateId: gateId,
        eventType: 'download',
      });
    } catch (error) {
      // Non-critical error: download succeeds even if analytics tracking fails
      console.error('Failed to track download event (non-critical):', error);
      return null;
    }
  }

  /**
   * Track pixel event for Conversion (download complete)
   * @param gate - Download gate entity
   * @param submission - Download submission
   * @param analyticsEventId - Analytics event ID for deduplication
   */
  private async trackPixelEvent(
    gate: DownloadGate,
    submission: any,
    analyticsEventId: string
  ): Promise<void> {
    try {
      if (!gate.pixelConfig) {
        return; // No pixel config
      }

      const trackPixelUseCase = new TrackPixelEventUseCase(this.pixelTrackingService!);

      await trackPixelUseCase.execute({
        gateId: gate.id,
        gateSlug: gate.slug,
        pixelConfig: gate.pixelConfig,
        event: PIXEL_EVENTS.CONVERSION,
        analyticsEventId,
        email: submission.email, // Will be hashed in TrackPixelEventUseCase
        userAgent: submission.userAgent,
        ipAddress: submission.ipAddress,
      });
    } catch (error) {
      // Fire and forget: log but don't throw
      console.error('[PixelTracking] trackPixelEvent failed (non-critical):', error);
    }
  }

}
