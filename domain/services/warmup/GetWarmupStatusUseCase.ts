/**
 * GetWarmupStatusUseCase
 *
 * Returns comprehensive warm-up progress and health metrics.
 * Used by UI to display warm-up status to users.
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { CheckWarmupHealthUseCase } from './CheckWarmupHealthUseCase';
import { sql } from '@/lib/db';

export interface GetWarmupStatusInput {
  userId: number;
  campaignId: string;
}

export interface GetWarmupStatusResult {
  warmupEnabled: boolean;
  currentDay: number;
  isComplete: boolean;
  isPaused: boolean;
  pauseReason: string | null;
  startedAt: Date | null;
  progress: {
    totalContacts: number;
    sentSoFar: number;
    remainingContacts: number;
    percentComplete: number;
  };
  health: {
    bounceRate: number;
    complaintRate: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  nextBatch: {
    day: number;
    quota: number;
  } | null;
  estimatedCompletionDate: Date | null;
}

export class GetWarmupStatusUseCase {
  constructor(
    private campaignRepository: IEmailCampaignRepository,
    private contactRepository: IContactRepository,
    private checkWarmupHealthUseCase: CheckWarmupHealthUseCase
  ) {}

  async execute(input: GetWarmupStatusInput): Promise<GetWarmupStatusResult> {
    // 1. Retrieve campaign
    const campaign = await this.campaignRepository.findById(
      parseInt(input.campaignId),
      input.userId
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // 2. Get total contacts
    const totalContacts = await this.contactRepository.countByUserId(input.userId);

    // 3. Count sent contacts for this campaign
    const sentResult = await sql`
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE campaign_id = ${parseInt(input.campaignId)}
    `;
    const sentSoFar = parseInt(sentResult.rows[0]?.count || '0');

    // 4. Get health metrics
    const health = await this.checkWarmupHealthUseCase.execute({
      userId: input.userId,
      campaignId: input.campaignId
    });

    // 5. Calculate progress
    const remainingContacts = Math.max(0, totalContacts - sentSoFar);
    const percentComplete = totalContacts > 0
      ? Math.round((sentSoFar / totalContacts) * 100)
      : 0;

    // 6. Get next batch info
    let nextBatch: { day: number; quota: number } | null = null;

    if (campaign.warmupEnabled && !campaign.isWarmupPaused() && !campaign.isWarmupComplete()) {
      const warmupSchedule = campaign.getWarmupSchedule(totalContacts);
      if (warmupSchedule) {
        nextBatch = {
          day: campaign.warmupCurrentDay,
          quota: warmupSchedule.getDailyQuota(campaign.warmupCurrentDay)
        };
      }
    }

    // 7. Get estimated completion date
    let estimatedCompletionDate: Date | null = null;
    if (campaign.warmupEnabled && campaign.warmupStartedAt) {
      const warmupSchedule = campaign.getWarmupSchedule(totalContacts);
      estimatedCompletionDate = warmupSchedule?.getEstimatedCompletionDate() || null;
    }

    return {
      warmupEnabled: campaign.warmupEnabled,
      currentDay: campaign.warmupCurrentDay,
      isComplete: campaign.isWarmupComplete(),
      isPaused: campaign.isWarmupPaused(),
      pauseReason: campaign.warmupPauseReason,
      startedAt: campaign.warmupStartedAt,
      progress: {
        totalContacts,
        sentSoFar,
        remainingContacts,
        percentComplete
      },
      health: {
        bounceRate: health.bounceRate,
        complaintRate: health.complaintRate,
        status: health.healthStatus
      },
      nextBatch,
      estimatedCompletionDate
    };
  }
}
