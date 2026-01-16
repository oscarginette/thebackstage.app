/**
 * SendWarmupBatchUseCase
 *
 * Sends the next batch of emails according to the warm-up schedule.
 * This is the core use case for gradual warm-up execution.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles batch sending logic
 * - Dependency Inversion: Depends on repository interfaces
 *
 * Business Logic:
 * 1. Validate warm-up is active (not paused, not complete)
 * 2. Calculate today's quota from schedule
 * 3. Get unsent contacts (batch selection)
 * 4. Send batch via email provider
 * 5. Record sends in email_logs
 * 6. Advance day if quota fulfilled
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { IEmailProvider } from '@/domain/providers/IEmailProvider';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { EmailCampaign } from '@/domain/entities/EmailCampaign';

export interface SendWarmupBatchInput {
  userId: number;
  campaignId: string;
}

export interface SendWarmupBatchResult {
  success: boolean;
  batchSent: number;
  batchFailed: number;
  warmupDay: number;
  isWarmupComplete: boolean;
  nextBatchQuota: number | null;
  failures?: Array<{ email: string; error: string }>;
  error?: string;
}

export class SendWarmupBatchUseCase {
  constructor(
    private campaignRepository: IEmailCampaignRepository,
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private executionLogRepository: IExecutionLogRepository
  ) {}

  async execute(input: SendWarmupBatchInput): Promise<SendWarmupBatchResult> {
    try {
      // 1. Retrieve campaign
      const campaign = await this.campaignRepository.findById(
        parseInt(input.campaignId),
        input.userId
      );

      if (!campaign) {
        return {
          success: false,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: 0,
          isWarmupComplete: false,
          nextBatchQuota: null,
          error: 'Campaign not found'
        };
      }

      // 2. Validate warm-up is active
      if (!campaign.warmupEnabled) {
        return {
          success: false,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: campaign.warmupCurrentDay,
          isWarmupComplete: false,
          nextBatchQuota: null,
          error: 'Warm-up is not enabled for this campaign'
        };
      }

      if (campaign.isWarmupPaused()) {
        return {
          success: false,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: campaign.warmupCurrentDay,
          isWarmupComplete: false,
          nextBatchQuota: null,
          error: `Warm-up is paused: ${campaign.warmupPauseReason}`
        };
      }

      if (campaign.isWarmupComplete()) {
        return {
          success: true,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: campaign.warmupCurrentDay,
          isWarmupComplete: true,
          nextBatchQuota: null
        };
      }

      // 3. Get total contacts for schedule calculation
      const totalContacts = await this.contactRepository.countByUserId(input.userId);
      const warmupSchedule = campaign.getWarmupSchedule(totalContacts);

      if (!warmupSchedule) {
        return {
          success: false,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: campaign.warmupCurrentDay,
          isWarmupComplete: false,
          nextBatchQuota: null,
          error: 'Failed to get warm-up schedule'
        };
      }

      // 4. Calculate today's quota
      const dailyQuota = warmupSchedule.getDailyQuota(campaign.warmupCurrentDay);

      if (dailyQuota === 0) {
        // No more contacts to send, advance day
        const updatedCampaign = campaign.advanceWarmupDay();
        await this.campaignRepository.update(updatedCampaign);

        const nextSchedule = updatedCampaign.getWarmupSchedule(totalContacts);
        const nextQuota = nextSchedule && !updatedCampaign.isWarmupComplete()
          ? nextSchedule.getDailyQuota(updatedCampaign.warmupCurrentDay)
          : null;

        return {
          success: true,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: updatedCampaign.warmupCurrentDay,
          isWarmupComplete: updatedCampaign.isWarmupComplete(),
          nextBatchQuota: nextQuota
        };
      }

      // 5. Get unsent contacts (batch selection)
      const unsentContacts = await this.contactRepository.getUnsentForCampaign(
        input.userId,
        input.campaignId,
        dailyQuota
      );

      if (unsentContacts.length === 0) {
        // No unsent contacts, advance day
        const updatedCampaign = campaign.advanceWarmupDay();
        await this.campaignRepository.update(updatedCampaign);

        const nextSchedule = updatedCampaign.getWarmupSchedule(totalContacts);
        const nextQuota = nextSchedule && !updatedCampaign.isWarmupComplete()
          ? nextSchedule.getDailyQuota(updatedCampaign.warmupCurrentDay)
          : null;

        return {
          success: true,
          batchSent: 0,
          batchFailed: 0,
          warmupDay: updatedCampaign.warmupCurrentDay,
          isWarmupComplete: updatedCampaign.isWarmupComplete(),
          nextBatchQuota: nextQuota
        };
      }

      // 6. Send batch
      let sentCount = 0;
      let failedCount = 0;
      const failures: Array<{ email: string; error: string }> = [];

      console.log(`[SendWarmupBatch] Day ${campaign.warmupCurrentDay}: Sending to ${unsentContacts.length} contacts`);

      for (const contact of unsentContacts) {
        try {
          // Send email via provider
          await this.emailProvider.send({
            to: contact.email,
            subject: campaign.subject || '',
            html: campaign.htmlContent || '',
            unsubscribeToken: contact.unsubscribeToken
          });

          // Record send in execution logs
          await this.executionLogRepository.create({
            userId: input.userId,
            campaignId: parseInt(input.campaignId),
            contactId: contact.id,
            status: 'sent',
            sentAt: new Date()
          });

          sentCount++;
        } catch (error) {
          console.error(`[SendWarmupBatch] Failed to send to ${contact.email}:`, error);
          failedCount++;
          failures.push({
            email: contact.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // 7. Check if we should advance day
      // Advance if we sent all unsent contacts OR fulfilled quota
      let updatedCampaign = campaign;

      if (sentCount >= dailyQuota || unsentContacts.length < dailyQuota) {
        updatedCampaign = campaign.advanceWarmupDay();
        await this.campaignRepository.update(updatedCampaign);
        console.log(`[SendWarmupBatch] Advancing to day ${updatedCampaign.warmupCurrentDay}`);
      }

      // 8. Calculate next batch quota
      const nextSchedule = updatedCampaign.getWarmupSchedule(totalContacts);
      const nextQuota = nextSchedule && !updatedCampaign.isWarmupComplete()
        ? nextSchedule.getDailyQuota(updatedCampaign.warmupCurrentDay)
        : null;

      return {
        success: true,
        batchSent: sentCount,
        batchFailed: failedCount,
        warmupDay: updatedCampaign.warmupCurrentDay,
        isWarmupComplete: updatedCampaign.isWarmupComplete(),
        nextBatchQuota: nextQuota,
        failures: failures.length > 0 ? failures : undefined
      };

    } catch (error) {
      console.error('[SendWarmupBatchUseCase] Error:', error);
      return {
        success: false,
        batchSent: 0,
        batchFailed: 0,
        warmupDay: 0,
        isWarmupComplete: false,
        nextBatchQuota: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
