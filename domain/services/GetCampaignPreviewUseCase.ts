/**
 * GetCampaignPreviewUseCase
 *
 * Retrieves campaign details for preview from execution history.
 * Returns read-only campaign data including HTML content and metadata.
 *
 * Clean Architecture: Business logic isolated from database concerns.
 * SOLID: Single Responsibility (only handles campaign preview retrieval).
 */

import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

export interface GetCampaignPreviewInput {
  executionLogId: number;
  userId: number;
}

export interface GetCampaignPreviewResult {
  success: boolean;
  campaign?: {
    id: string;
    templateId?: string | null;
    trackId?: string | null;
    subject: string;
    htmlContent: string;
    sentAt: Date;
    emailsSent: number;
    senderEmail?: string | null;
    senderName?: string | null;
    metadata: {
      greeting?: string;
      message?: string;
      signature?: string;
      coverImageUrl?: string;
      trackTitle?: string;
      trackUrl?: string;
    };
  };
  error?: string;
}

/**
 * GetCampaignPreviewUseCase
 *
 * Retrieves campaign preview data for historical campaigns.
 * Ensures multi-tenant security by verifying user ownership.
 */
export class GetCampaignPreviewUseCase {
  constructor(
    private executionLogRepository: IExecutionLogRepository,
    private campaignRepository: IEmailCampaignRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param input - Execution log ID and user ID for security
   * @returns Campaign preview data or error
   */
  async execute(input: GetCampaignPreviewInput): Promise<GetCampaignPreviewResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Fetch execution log with security check
      const executionLog = await this.executionLogRepository.findById(input.executionLogId);

      if (!executionLog) {
        return {
          success: false,
          error: 'Execution log not found'
        };
      }

      // 3. Multi-tenant security: Verify user owns this execution log
      if (executionLog.userId !== input.userId) {
        return {
          success: false,
          error: 'Unauthorized access to this campaign'
        };
      }

      // 4. Check if campaign_id exists
      if (!executionLog.campaignId) {
        return {
          success: false,
          error: 'Campaign data not available for this execution'
        };
      }

      // 5. Fetch campaign from email_campaigns table
      const campaign = await this.campaignRepository.findById(executionLog.campaignId);

      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }

      // 6. Verify campaign has required data
      if (!campaign.htmlContent) {
        return {
          success: false,
          error: 'Campaign HTML content not available'
        };
      }

      if (!campaign.subject) {
        return {
          success: false,
          error: 'Campaign subject not available'
        };
      }

      // 7. Fetch user sender information
      const user = await this.userRepository.findById(input.userId);

      // 8. Return campaign preview data
      return {
        success: true,
        campaign: {
          id: campaign.id,
          templateId: campaign.templateId || null,
          trackId: campaign.trackId || null,
          subject: campaign.subject,
          htmlContent: campaign.htmlContent,
          sentAt: campaign.sentAt ? new Date(campaign.sentAt) : new Date(),
          emailsSent: executionLog.emailsSent || 0,
          senderEmail: user?.senderEmail || null,
          senderName: user?.senderName || null,
          metadata: {
            greeting: campaign.greeting || undefined,
            message: campaign.message || undefined,
            signature: campaign.signature || undefined,
            coverImageUrl: campaign.coverImageUrl || undefined,
            trackTitle: executionLog.trackTitle || undefined,
            trackUrl: undefined // Track URL not stored in execution log
          }
        }
      };
    } catch (error) {
      console.error('GetCampaignPreviewUseCase error:', error);
      return {
        success: false,
        error: 'Failed to retrieve campaign preview'
      };
    }
  }

  /**
   * Validate input parameters
   *
   * @param input - Input to validate
   * @throws Error if validation fails
   */
  private validateInput(input: GetCampaignPreviewInput): void {
    if (!input.executionLogId || input.executionLogId <= 0) {
      throw new Error('Invalid execution log ID');
    }

    if (!input.userId || input.userId <= 0) {
      throw new Error('Invalid user ID');
    }
  }
}
