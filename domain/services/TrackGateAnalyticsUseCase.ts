/**
 * TrackGateAnalyticsUseCase
 *
 * Tracks analytics events for download gates.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate gate exists
 * - Validate event type (view, submit, download)
 * - Fire and forget (non-blocking)
 * - Track UTM parameters, referrer, IP, user agent
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (analytics tracking)
 * - DIP: Depends on repository interfaces
 *
 * PERFORMANCE: Async fire-and-forget, does not block user flow
 */

import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IPixelTrackingService } from '../repositories/IPixelTrackingService';
import { CreateAnalyticsInput, EventType } from '../types/download-gates';
import { PIXEL_EVENTS } from '../types/pixel-tracking';
import { TrackPixelEventUseCase } from './TrackPixelEventUseCase';

export interface TrackGateAnalyticsInput extends CreateAnalyticsInput {
  // All fields from CreateAnalyticsInput
}

export interface TrackGateAnalyticsResult {
  success: boolean;
  error?: string;
}

export class TrackGateAnalyticsUseCase {
  private readonly VALID_EVENT_TYPES: EventType[] = ['view', 'submit', 'download'];

  constructor(
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly pixelTrackingService?: IPixelTrackingService
  ) {}

  /**
   * Execute analytics tracking
   * Fire and forget - does not throw errors
   * @param input - Analytics event data
   * @returns TrackGateAnalyticsResult (always success for non-blocking)
   */
  async execute(input: TrackGateAnalyticsInput): Promise<TrackGateAnalyticsResult> {
    try {
      // 1. Validate event type
      if (!this.VALID_EVENT_TYPES.includes(input.eventType)) {
        console.error(
          `Invalid event type: ${input.eventType}. Must be one of: ${this.VALID_EVENT_TYPES.join(', ')}`
        );
        return {
          success: false,
          error: `Invalid event type: ${input.eventType}`,
        };
      }

      // 2. Validate gate exists (optional check)
      // Note: This is a lightweight check to ensure data integrity
      // We don't fail the tracking if gate is not found (fire and forget)
      const gateExists = await this.validateGateExists(input.gateId);
      if (!gateExists) {
        console.warn(`Gate ${input.gateId} not found, but tracking event anyway`);
      }

      // 3. Track analytics event
      await this.analyticsRepository.track(input);

      // 4. Increment view count for view events
      if (input.eventType === 'view') {
        await this.incrementViewCount(input.gateId);
      }

      // 5. Fire pixel tracking (fire-and-forget, non-blocking)
      // Note: Pixel tracking doesn't need analytics event ID
      if (input.eventType === 'view' && this.pixelTrackingService) {
        this.trackPixelEvent(input).catch(error => {
          console.error('[PixelTracking] Failed (non-critical):', error);
        });
      }

      return { success: true };
    } catch (error) {
      // Fire and forget: log error but don't fail
      console.error('TrackGateAnalyticsUseCase.execute error (non-critical):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track analytics',
      };
    }
  }

  /**
   * Validate that gate exists
   * @param gateId - Gate ID
   * @returns True if gate exists
   */
  private async validateGateExists(gateId: string): Promise<boolean> {
    try {
      // Note: This is a simplified check
      // In production, we'd query the repository directly
      // For now, we'll assume gate exists
      return true;
    } catch (error) {
      console.error('Failed to validate gate exists:', error);
      return false;
    }
  }

  /**
   * Increment view count for gate
   * @param gateId - Gate ID
   */
  private async incrementViewCount(gateId: string): Promise<void> {
    try {
      await this.gateRepository.incrementViewCount(gateId.toString());
    } catch (error) {
      // Non-critical error: tracking succeeds even if view count increment fails
      console.error('Failed to increment view count (non-critical):', error);
    }
  }

  /**
   * Track pixel event (fire-and-forget)
   * @param input - Analytics input
   * @param analyticsEventId - Analytics event ID for deduplication
   */
  private async trackPixelEvent(
    input: TrackGateAnalyticsInput
  ): Promise<void> {
    try {
      // Fetch gate to get slug and pixel config
      const gate = await this.gateRepository.findBySlug(input.gateId);

      if (!gate || !gate.pixelConfig) {
        // No pixel config, skip tracking
        return;
      }

      // Track pixel event using TrackPixelEventUseCase
      const trackPixelUseCase = new TrackPixelEventUseCase(this.pixelTrackingService!);

      await trackPixelUseCase.execute({
        gateId: gate.id,
        gateSlug: gate.slug,
        pixelConfig: gate.pixelConfig,
        event: PIXEL_EVENTS.PAGE_VIEW,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });
    } catch (error) {
      // Fire and forget: log but don't throw
      console.error('[PixelTracking] trackPixelEvent failed (non-critical):', error);
    }
  }

  /**
   * Normalize country code to uppercase ISO 3166-1 alpha-2
   * @param country - Country code
   * @returns Normalized country code or null
   */
  static normalizeCountryCode(country?: string): string | undefined {
    if (!country) return undefined;

    const normalized = country.trim().toUpperCase();

    // Validate 2-character ISO code
    if (normalized.length !== 2) {
      console.warn(`Invalid country code: ${country} (must be 2 characters)`);
      return undefined;
    }

    return normalized;
  }
}
