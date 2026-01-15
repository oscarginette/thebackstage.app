/**
 * AutoSaveCampaignUseCase
 *
 * Use case for auto-saving campaign drafts.
 * Creates new campaigns or updates existing ones without strict validation.
 *
 * Key differences from SaveDraftUseCase:
 * - Does NOT throw errors for incomplete data
 * - Accepts partial/incomplete fields
 * - Used for real-time auto-save (every keystroke)
 * - Always returns success with campaign ID
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles auto-save logic
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';

export interface AutoSaveCampaignInput {
  userId: number; // Multi-tenant: User who owns this campaign
  campaignId?: string; // If provided, update existing campaign
  templateId?: string | null;
  trackId?: string | null;
  subject?: string;
  greeting?: string;
  message?: string;
  signature?: string;
  coverImageUrl?: string;
  scheduledAt?: Date | null;
}

export interface AutoSaveCampaignResult {
  success: boolean;
  campaignId: string;
  isNew: boolean;
  savedAt: Date;
}

export class AutoSaveCampaignUseCase {
  constructor(
    private campaignRepository: IEmailCampaignRepository
  ) {}

  async execute(input: AutoSaveCampaignInput): Promise<AutoSaveCampaignResult> {
    const savedAt = new Date();

    // If campaignId provided, update existing campaign
    if (input.campaignId) {
      return await this.updateExistingCampaign(input, savedAt);
    }

    // Otherwise, create new campaign
    return await this.createNewCampaign(input, savedAt);
  }

  private async createNewCampaign(
    input: AutoSaveCampaignInput,
    savedAt: Date
  ): Promise<AutoSaveCampaignResult> {
    const campaign = await this.campaignRepository.create({
      userId: input.userId,
      templateId: input.templateId || null,
      trackId: input.trackId || null,
      subject: input.subject || '',
      greeting: input.greeting || '',
      message: input.message || '',
      signature: input.signature || '',
      coverImageUrl: input.coverImageUrl,
      htmlContent: '', // Will be compiled when sending
      status: 'draft',
      scheduledAt: input.scheduledAt || null
    });

    console.log(`[AutoSave] Campaign created: ${campaign.id}`);

    return {
      success: true,
      campaignId: campaign.id,
      isNew: true,
      savedAt
    };
  }

  private async updateExistingCampaign(
    input: AutoSaveCampaignInput,
    savedAt: Date
  ): Promise<AutoSaveCampaignResult> {
    // Check if campaign exists
    const existingCampaign = await this.campaignRepository.findById(input.campaignId!);

    if (!existingCampaign) {
      // Campaign doesn't exist, create new one instead
      console.log(`[AutoSave] Campaign ${input.campaignId} not found, creating new one`);
      return await this.createNewCampaign(input, savedAt);
    }

    // Cannot auto-save sent campaigns
    if (existingCampaign.status === 'sent') {
      console.log(`[AutoSave] Cannot auto-save sent campaign ${input.campaignId}`);
      return {
        success: false,
        campaignId: input.campaignId!,
        isNew: false,
        savedAt
      };
    }

    // Update the campaign (only update fields that were provided)
    await this.campaignRepository.update({
      id: input.campaignId!,
      subject: input.subject,
      greeting: input.greeting,
      message: input.message,
      signature: input.signature,
      coverImageUrl: input.coverImageUrl,
      scheduledAt: input.scheduledAt
    });

    console.log(`[AutoSave] Campaign updated: ${input.campaignId}`);

    return {
      success: true,
      campaignId: input.campaignId!,
      isNew: false,
      savedAt
    };
  }
}
