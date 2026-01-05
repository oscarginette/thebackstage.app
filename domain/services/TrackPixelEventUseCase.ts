/**
 * TrackPixelEventUseCase
 *
 * Orchestrates pixel tracking for download gate events.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Hash emails with SHA-256 (GDPR-compliant)
 * - Use analytics event ID for deduplication
 * - Send to all enabled platforms in parallel
 * - Fire-and-forget: failures logged but don't throw
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (pixel event tracking)
 * - DIP: Depends on IPixelTrackingService interface
 */

import crypto from 'crypto';
import {
  IPixelTrackingService,
  PixelEventData,
  PixelTrackingResult,
} from '../repositories/IPixelTrackingService';
import { PixelConfig } from '../entities/PixelConfig';
import { PixelEvent, EVENT_MAPPING } from '../types/pixel-tracking';

// ============================================================================
// Input/Output Interfaces
// ============================================================================

export interface TrackPixelEventInput {
  /**
   * Download gate ID (UUID)
   */
  gateId: string;

  /**
   * Download gate slug (for event source URL)
   */
  gateSlug: string;

  /**
   * Pixel configuration from gate
   */
  pixelConfig: PixelConfig;

  /**
   * Event type to track (PAGE_VIEW, LEAD, CONVERSION)
   */
  event: PixelEvent;

  /**
   * Deduplication ID (UUID from analytics table)
   * Prevents same event being counted twice
   * Optional since analytics repository no longer returns IDs
   */
  analyticsEventId?: string;

  /**
   * User email (optional)
   * Only provided for LEAD and CONVERSION events
   * Will be hashed before sending to pixels
   */
  email?: string;

  /**
   * User agent string (optional)
   * For device/browser attribution
   */
  userAgent?: string;

  /**
   * IP address (optional)
   * For geographic attribution
   */
  ipAddress?: string;
}

export interface TrackPixelEventResult {
  /**
   * Whether at least one platform was tracked successfully
   */
  success: boolean;

  /**
   * Platforms that received the event successfully
   */
  platformsTracked: string[];

  /**
   * Errors encountered (if any)
   */
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export class TrackPixelEventUseCase {
  constructor(
    private readonly pixelTrackingService: IPixelTrackingService
  ) {}

  /**
   * Execute pixel event tracking
   *
   * @param input - Event data and configuration
   * @returns Promise<TrackPixelEventResult> - Success/failure summary
   *
   * Fire-and-Forget:
   * - Errors are logged but not thrown
   * - Returns { success: false } instead of throwing
   * - Never blocks user flow
   */
  async execute(input: TrackPixelEventInput): Promise<TrackPixelEventResult> {
    try {
      // 1. Build event source URL
      const eventSourceUrl = `https://thebackstage.app/gate/${input.gateSlug}`;

      // 2. Hash email if provided (GDPR-compliant)
      const emailHash = input.email
        ? this.hashEmail(input.email)
        : undefined;

      // 3. Get enabled platforms
      const enabledPlatforms = input.pixelConfig.getEnabledPlatforms();

      if (enabledPlatforms.length === 0) {
        // No platforms enabled, return success (nothing to track)
        return {
          success: true,
          platformsTracked: [],
        };
      }

      // 4. Send to all enabled platforms in parallel
      const results = await Promise.all(
        enabledPlatforms.map(async (platform) => {
          // Get platform-specific event name
          const eventName = EVENT_MAPPING[input.event][platform];

          // Build event data
          const eventData: PixelEventData = {
            eventId: input.analyticsEventId || crypto.randomUUID(), // Fallback to random UUID
            eventName,
            eventTime: Math.floor(Date.now() / 1000), // Unix timestamp (seconds)
            eventSourceUrl,
            emailHash,
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
          };

          // Send event
          return this.pixelTrackingService.sendEvent(
            platform,
            input.pixelConfig,
            eventData
          );
        })
      );

      // 5. Collect results
      const platformsTracked = results
        .filter(r => r.success)
        .map(r => r.platform);

      const errors = results
        .filter(r => !r.success)
        .map(r => `${r.platform}: ${r.error}`);

      // Log results
      if (platformsTracked.length > 0) {
        console.log(`[PixelTracking] Event tracked:`, {
          event: input.event,
          platforms: platformsTracked,
          eventId: input.analyticsEventId,
        });
      }

      if (errors.length > 0) {
        console.error(`[PixelTracking] Errors (non-critical):`, errors);
      }

      return {
        success: platformsTracked.length > 0,
        platformsTracked,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      // Fire and forget: log but don't throw
      console.error('[PixelTracking] Non-critical error in TrackPixelEventUseCase:', error);

      return {
        success: false,
        platformsTracked: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Hash email using SHA-256 (Facebook/TikTok requirement)
   *
   * GDPR Compliance:
   * - Normalizes email (lowercase, trim)
   * - One-way hash (cannot be reversed)
   * - Minimizes PII exposure
   *
   * @param email - Email address to hash
   * @returns SHA-256 hash (hex string)
   */
  private hashEmail(email: string): string {
    const normalized = email.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
