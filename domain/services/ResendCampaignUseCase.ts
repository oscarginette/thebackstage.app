/**
 * ResendCampaignUseCase
 *
 * Duplicates a historical campaign as a new draft for resending.
 * Follows Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Only sent campaigns can be resent
 * - Creates a new draft (never modifies original)
 * - Preserves all campaign content and metadata
 * - Multi-tenant: Verifies ownership before duplicating
 *
 * Security:
 * - Validates user owns the original campaign
 * - Creates new campaign ID (no ID reuse)
 */

import { IEmailCampaignRepository, CreateCampaignInput } from '@/domain/repositories/IEmailCampaignRepository';

export interface ResendCampaignInput {
  userId: number;
  campaignId: string; // Original campaign to duplicate (changed from number to string - UUID)
}

export interface ResendCampaignResult {
  success: boolean;
  newDraftId?: string;
  originalCampaign?: {
    subject: string | null;
    greeting: string | null;
    message: string | null;
    signature: string | null;
    coverImageUrl: string | null;
    trackId: string | null;
  };
  error?: string;
}

export class ResendCampaignUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  async execute(input: ResendCampaignInput): Promise<ResendCampaignResult> {
    // 1. Retrieve original campaign
    const originalCampaign = await this.campaignRepository.findById(input.campaignId);

    // 2. Verify campaign exists
    if (!originalCampaign) {
      return {
        success: false,
        error: 'Campaign not found'
      };
    }

    // 3. Verify ownership (security check)
    // Note: Campaign should have userId from database, we'll access it via any cast
    const campaignUserId = (originalCampaign as any).userId;
    if (campaignUserId !== input.userId) {
      return {
        success: false,
        error: 'Unauthorized: You do not own this campaign'
      };
    }

    // 4. Validate campaign was sent (can only resend sent campaigns)
    if (originalCampaign.status !== 'sent') {
      return {
        success: false,
        error: 'Only sent campaigns can be resent. This campaign is still a draft.'
      };
    }

    // 5. Create new draft with copied data
    const newDraftInput: CreateCampaignInput = {
      userId: input.userId,
      templateId: originalCampaign.templateId || undefined,
      trackId: originalCampaign.trackId || undefined,
      subject: originalCampaign.subject || undefined,
      greeting: (originalCampaign as any).greeting || undefined,
      message: (originalCampaign as any).message || undefined,
      signature: (originalCampaign as any).signature || undefined,
      coverImageUrl: (originalCampaign as any).coverImageUrl || undefined,
      htmlContent: originalCampaign.htmlContent || undefined,
      status: 'draft', // Always create as draft
      scheduledAt: null // Clear scheduling
    };

    const newDraft = await this.campaignRepository.create(newDraftInput);

    // 6. Return new draft ID and original data
    return {
      success: true,
      newDraftId: newDraft.id,
      originalCampaign: {
        subject: originalCampaign.subject,
        greeting: (originalCampaign as any).greeting || null,
        message: (originalCampaign as any).message || null,
        signature: (originalCampaign as any).signature || null,
        coverImageUrl: (originalCampaign as any).coverImageUrl || null,
        trackId: originalCampaign.trackId
      }
    };
  }
}
