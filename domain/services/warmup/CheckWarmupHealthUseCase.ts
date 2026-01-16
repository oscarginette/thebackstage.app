/**
 * CheckWarmupHealthUseCase
 *
 * Calculates bounce/complaint rates and auto-pauses if thresholds exceeded.
 * Critical for maintaining sender reputation during warm-up.
 *
 * Thresholds:
 * - Healthy: bounce <3%, complaint <0.05%
 * - Warning: bounce 3-5%, complaint 0.05-0.1%
 * - Critical: bounce >5%, complaint >0.1%
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IEmailEventRepository } from '@/domain/repositories/IEmailEventRepository';

export interface CheckWarmupHealthInput {
  userId: number;
  campaignId: string;
}

export interface CheckWarmupHealthResult {
  bounceRate: number;
  complaintRate: number;
  totalSent: number;
  totalBounced: number;
  totalComplaints: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  shouldPause: boolean;
  pauseReason?: string;
}

export class CheckWarmupHealthUseCase {
  constructor(
    private campaignRepository: IEmailCampaignRepository,
    private emailEventRepository: IEmailEventRepository
  ) {}

  async execute(input: CheckWarmupHealthInput): Promise<CheckWarmupHealthResult> {
    // 1. Get campaign stats
    const stats = await this.emailEventRepository.getStatsForCampaign(input.campaignId);

    // 2. Calculate rates
    const bounceRate = stats.totalSent > 0
      ? (stats.totalBounced / stats.totalSent) * 100
      : 0;

    const complaintRate = stats.totalSent > 0
      ? (stats.totalComplaints / stats.totalSent) * 100
      : 0;

    // 3. Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    let shouldPause = false;
    let pauseReason: string | undefined;

    // Critical thresholds
    if (bounceRate > 5 || complaintRate > 0.1) {
      healthStatus = 'critical';
      shouldPause = true;
      pauseReason = `High ${bounceRate > 5 ? 'bounce' : 'complaint'} rate detected (bounce: ${bounceRate.toFixed(2)}%, complaints: ${complaintRate.toFixed(2)}%)`;
    }
    // Warning thresholds
    else if (bounceRate >= 3 || complaintRate >= 0.05) {
      healthStatus = 'warning';
    }

    // 4. Auto-pause if critical
    if (shouldPause && pauseReason) {
      const campaign = await this.campaignRepository.findById(
        parseInt(input.campaignId),
        input.userId
      );

      if (campaign && campaign.warmupEnabled && !campaign.isWarmupPaused()) {
        const pausedCampaign = campaign.pauseWarmup(pauseReason);
        await this.campaignRepository.update(pausedCampaign);
        console.log(`[CheckWarmupHealth] Auto-paused campaign ${input.campaignId}: ${pauseReason}`);
      }
    }

    return {
      bounceRate: parseFloat(bounceRate.toFixed(2)),
      complaintRate: parseFloat(complaintRate.toFixed(4)),
      totalSent: stats.totalSent,
      totalBounced: stats.totalBounced,
      totalComplaints: stats.totalComplaints,
      healthStatus,
      shouldPause,
      pauseReason
    };
  }
}
