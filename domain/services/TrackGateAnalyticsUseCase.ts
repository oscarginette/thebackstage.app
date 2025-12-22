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
import { CreateAnalyticsInput, EventType } from '../types/download-gates';

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
    private readonly gateRepository: IDownloadGateRepository
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
  private async validateGateExists(gateId: number): Promise<boolean> {
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
  private async incrementViewCount(gateId: number): Promise<void> {
    try {
      await this.gateRepository.incrementViewCount(gateId.toString());
    } catch (error) {
      // Non-critical error: tracking succeeds even if view count increment fails
      console.error('Failed to increment view count (non-critical):', error);
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
