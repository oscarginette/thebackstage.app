/**
 * StartWarmupCampaignUseCase
 *
 * Enables warm-up for a draft campaign.
 * Validates campaign readiness and returns warm-up schedule preview.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles warm-up initialization
 * - Dependency Inversion: Depends on repository interfaces
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { EmailCampaign } from '@/domain/entities/EmailCampaign';

export interface StartWarmupInput {
  userId: number;
  campaignId: string;
}

export interface StartWarmupResult {
  success: boolean;
  campaign?: EmailCampaign;
  warmupSchedule?: {
    totalContacts: number;
    estimatedDays: number;
    dailyQuotas: Array<{ day: number; quota: number }>;
  };
  error?: string;
}

export class StartWarmupCampaignUseCase {
  constructor(
    private campaignRepository: IEmailCampaignRepository,
    private contactRepository: IContactRepository
  ) {}

  async execute(input: StartWarmupInput): Promise<StartWarmupResult> {
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

      // 2. Validate campaign is draft
      if (campaign.status !== 'draft') {
        return {
          success: false,
          error: 'Can only enable warm-up on draft campaigns'
        };
      }

      // 3. Validate campaign readiness
      if (!campaign.subject || campaign.subject.trim() === '') {
        return {
          success: false,
          error: 'Campaign subject is required'
        };
      }

      if (!campaign.htmlContent || campaign.htmlContent.trim() === '') {
        return {
          success: false,
          error: 'Campaign content is required'
        };
      }

      // 4. Count subscribed contacts
      const totalContacts = await this.contactRepository.countByUserId(input.userId);

      if (totalContacts === 0) {
        return {
          success: false,
          error: 'No subscribed contacts found'
        };
      }

      // 5. Enable warm-up on campaign
      const updatedCampaign = campaign.enableWarmup();

      // 6. Persist changes
      await this.campaignRepository.update(updatedCampaign);

      // 7. Get warm-up schedule preview
      const warmupSchedule = updatedCampaign.getWarmupSchedule(totalContacts);

      if (!warmupSchedule) {
        return {
          success: false,
          error: 'Failed to create warm-up schedule'
        };
      }

      return {
        success: true,
        campaign: updatedCampaign,
        warmupSchedule: {
          totalContacts,
          estimatedDays: 7, // Fixed 7-day schedule
          dailyQuotas: warmupSchedule.getAllDailyQuotas()
        }
      };
    } catch (error) {
      console.error('[StartWarmupCampaignUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
