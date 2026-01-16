/**
 * ResumeWarmupCampaignUseCase
 *
 * Resumes a paused warm-up campaign.
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { EmailCampaign } from '@/domain/entities/EmailCampaign';

export interface ResumeWarmupInput {
  userId: number;
  campaignId: string;
}

export interface ResumeWarmupResult {
  success: boolean;
  campaign?: EmailCampaign;
  error?: string;
}

export class ResumeWarmupCampaignUseCase {
  constructor(private campaignRepository: IEmailCampaignRepository) {}

  async execute(input: ResumeWarmupInput): Promise<ResumeWarmupResult> {
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

      // 2. Validate warm-up is paused
      if (!campaign.warmupEnabled) {
        return {
          success: false,
          error: 'Warm-up is not enabled for this campaign'
        };
      }

      if (!campaign.isWarmupPaused()) {
        return {
          success: false,
          error: 'Warm-up is not paused'
        };
      }

      // 3. Resume warm-up
      const resumedCampaign = campaign.resumeWarmup();

      // 4. Persist changes
      await this.campaignRepository.update(resumedCampaign);

      return {
        success: true,
        campaign: resumedCampaign
      };
    } catch (error) {
      console.error('[ResumeWarmupCampaignUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
