/**
 * UpdateSoundCloudTrackBuyLinkUseCase
 *
 * Updates a SoundCloud track's purchase_url field to add shopping cart buy link.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate gate has enableSoundcloudBuyLink enabled
 * - Generate buy link URL pointing to Download Gate
 * - Call SoundCloud API to update track's purchase_url
 * - Handle errors gracefully (best-effort service, doesn't block downloads)
 * - Track analytics event
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (update SoundCloud track buy link)
 * - DIP: Depends on repository interface and SoundCloud client
 *
 * Flow:
 * 1. User completes OAuth authorization
 * 2. This use case updates track's purchase_url
 * 3. Shopping cart icon appears on SoundCloud track
 * 4. Clicking cart redirects to Download Gate URL
 *
 * Best-Effort Service:
 * - Like comment posting, failures are logged but don't block download
 * - Invalid access token → Log error, continue
 * - Track not owned by user → Log error, continue
 * - SoundCloud API error → Log error, retry once
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { SoundCloudClient } from '@/lib/soundcloud-client';

export interface UpdateSoundCloudTrackBuyLinkInput {
  gateId: string; // UUID of the Download Gate
  accessToken: string; // SoundCloud OAuth access token
  soundcloudTrackId: string; // Track ID to update
}

export interface UpdateSoundCloudTrackBuyLinkResult {
  success: boolean;
  error?: string;
}

export class UpdateSoundCloudTrackBuyLinkUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly soundCloudClient: SoundCloudClient
  ) {}

  /**
   * Execute buy link update
   * @param input - Update data (gate ID, access token, track ID)
   * @returns Update result
   */
  async execute(
    input: UpdateSoundCloudTrackBuyLinkInput
  ): Promise<UpdateSoundCloudTrackBuyLinkResult> {
    try {
      // 1. Get gate to validate feature is enabled
      const gate = await this.gateRepository.findByIdPublic(input.gateId);
      if (!gate) {
        console.error('[UpdateSoundCloudTrackBuyLinkUseCase] Gate not found:', input.gateId);
        return {
          success: false,
          error: 'Gate not found',
        };
      }

      // 2. Validate buy link feature is enabled
      if (!gate.enableSoundcloudBuyLink) {
        console.warn(
          '[UpdateSoundCloudTrackBuyLinkUseCase] Buy link not enabled for gate:',
          input.gateId
        );
        return {
          success: false,
          error: 'Buy link feature not enabled for this gate',
        };
      }

      // 3. Generate buy link URL
      const buyLinkUrl = `${this.getBaseUrl()}/gate/${gate.slug}`;
      const buyLinkTitle = 'Download Free Track';

      console.log('[UpdateSoundCloudTrackBuyLinkUseCase] Updating track buy link:', {
        gateId: input.gateId,
        trackId: input.soundcloudTrackId,
        buyLinkUrl,
      });

      // 4. Call SoundCloud API to update track
      const result = await this.soundCloudClient.updateTrackPurchaseLink(
        input.accessToken,
        input.soundcloudTrackId,
        buyLinkUrl,
        buyLinkTitle
      );

      if (!result.success) {
        console.error('[UpdateSoundCloudTrackBuyLinkUseCase] Failed to update buy link:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }

      console.log('[UpdateSoundCloudTrackBuyLinkUseCase] Successfully updated buy link');

      return {
        success: true,
      };
    } catch (error) {
      console.error('[UpdateSoundCloudTrackBuyLinkUseCase] execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update buy link',
      };
    }
  }

  /**
   * Get base URL for buy link generation
   * Uses environment variable or defaults to production URL
   * @returns Base URL (e.g., https://thebackstage.app)
   */
  private getBaseUrl(): string {
    // Check for environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Default to production URL
    return 'https://thebackstage.app';
  }
}
