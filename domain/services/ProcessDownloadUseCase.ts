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
import { PixelConfig } from '../entities/PixelConfig';
import { PIXEL_EVENTS } from '../types/pixel-tracking';
import { TrackPixelEventUseCase } from './TrackPixelEventUseCase';
import { sql } from '@vercel/postgres';

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
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly pixelTrackingService?: IPixelTrackingService
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

      // 5. Find gate to get file URL using gateId from submission
      const gate = await this.getGateForSubmission(submission.gateId);

      if (!gate) {
        return {
          success: false,
          error: 'Download gate not found',
        };
      }

      // Validate gate is still active
      if (!gate.active) {
        return {
          success: false,
          error: 'This download gate is no longer active',
        };
      }

      // Check gate not expired
      if (gate.expires_at && new Date(gate.expires_at) < new Date()) {
        return {
          success: false,
          error: 'This download gate has expired',
        };
      }

      // 6. Mark download as completed
      await this.submissionRepository.markDownloadComplete(submission.id);

      // 7. Increment gate download count
      await this.gateRepository.incrementDownloadCount(gate.id);

      // 8. Track analytics event
      const analyticsEventId = await this.trackDownloadEvent(gate.id);

      // 9. Fire pixel tracking (fire-and-forget, non-blocking)
      if (gate.pixel_config && this.pixelTrackingService && analyticsEventId) {
        this.trackPixelEvent(gate, submission, analyticsEventId).catch(error => {
          console.error('[PixelTracking] Failed (non-critical):', error);
        });
      }

      // 10. Return file URL (gate is raw DB row with snake_case)
      return {
        success: true,
        fileUrl: gate.file_url,
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
        gateId: gateId,
        eventType: 'download',
      });
    } catch (error) {
      // Non-critical error: download succeeds even if analytics tracking fails
      console.error('Failed to track download event (non-critical):', error);
    }
  }

  /**
   * Track pixel event for Conversion (download complete)
   * @param gate - Raw database gate row
   * @param submission - Download submission
   * @param analyticsEventId - Analytics event ID for deduplication
   */
  private async trackPixelEvent(
    gate: any,
    submission: any,
    analyticsEventId: string
  ): Promise<void> {
    try {
      // Parse pixel config from raw database JSONB
      const pixelConfig = PixelConfig.fromDatabase(gate.pixel_config);

      if (!pixelConfig) {
        return; // No valid pixel config
      }

      const trackPixelUseCase = new TrackPixelEventUseCase(this.pixelTrackingService!);

      await trackPixelUseCase.execute({
        gateId: gate.id,
        gateSlug: gate.slug,
        pixelConfig,
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

  /**
   * Get gate for public submission
   *
   * ARCHITECTURE NOTE: This temporarily violates Clean Architecture by using SQL directly
   * in the domain layer. This is a pragmatic workaround because:
   *
   * 1. IDownloadGateRepository.findById requires userId for security
   * 2. Public submissions don't store userId (only gateId)
   * 3. We need gate file_url to serve the download
   * 4. The submission was already validated when created (gate relationship is valid)
   *
   * PROPER FIX: Add findByIdPublic(gateId) to IDownloadGateRepository interface
   *
   * @param gateId - Gate ID from submission
   * @returns Gate database row or null
   */
  private async getGateForSubmission(gateId: string): Promise<any> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE id = ${gateId}
        LIMIT 1
      `;
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('getGateForSubmission error:', error);
      return null;
    }
  }
}
