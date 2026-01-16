/**
 * PauseWarmupCampaignUseCase
 *
 * Pauses warm-up for a campaign (manual or auto-pause from health check).
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { EmailCampaign } from '@/domain/entities/EmailCampaign';

export interface PauseWarmupInput {
  userId: number;
  campaignId: string;
  reason: string;
}

export interface PauseWarmupResult {
  success: boolean;
  campaign?: EmailCampaign;
  error?: string;
}

export class PauseWarmupCampaignUseCase {
  constructor(private campaignRepository: IEmailCampaignRepository) {}

  async execute(input: PauseWarmupInput): Promise<PauseWarmupResult> {
    try {
      // 1. Retrieve campaign
      const campaign = await this.campaignRepository.findById(
        parseInt(input.campaignId),
        input.userId
      );

      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }

      // 2. Validate warm-up is active
      if (!campaign.warmupEnabled) {
        return {
          success: false,
          error: 'Warm-up is not enabled for this campaign'
        };
      }

      if (campaign.isWarmupPaused()) {
        return {
          success: false,
          error: 'Warm-up is already paused'
        };
      }

      // 3. Pause warm-up
      const pausedCampaign = campaign.pauseWarmup(input.reason);

      // 4. Persist changes
      await this.campaignRepository.update(pausedCampaign);

      return {
        success: true,
        campaign: pausedCampaign
      };
    } catch (error) {
      console.error('[PauseWarmupCampaignUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
