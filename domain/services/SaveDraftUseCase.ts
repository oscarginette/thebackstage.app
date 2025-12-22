/**
 * SaveDraftUseCase
 *
 * Use case for saving email drafts.
 * Supports creating new drafts and updating existing ones.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles draft saving logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { render } from '@react-email/components';
import CustomEmail from '@/emails/custom-email';

export interface SaveDraftInput {
  id?: string; // If provided, update existing draft
  templateId?: string | null;
  trackId?: string | null;
  subject: string;
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  scheduledAt?: Date | null;
}

export interface SaveDraftResult {
  success: boolean;
  campaignId: string;
  isNew: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SaveDraftUseCase {
  constructor(private campaignRepository: IEmailCampaignRepository) {}

  async execute(input: SaveDraftInput): Promise<SaveDraftResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Build HTML content
    const htmlContent = await this.buildHtmlContent(input);

    // 3. Check if updating existing draft or creating new
    if (input.id) {
      return await this.updateExistingDraft(input.id, input, htmlContent);
    } else {
      return await this.createNewDraft(input, htmlContent);
    }
  }

  private validateInput(input: SaveDraftInput): void {
    // Subject is always required (even for drafts)
    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }

    // Validate length limits (allow empty but set max lengths)
    if (input.subject.length > 500) {
      throw new ValidationError('Subject cannot exceed 500 characters');
    }

    if (input.greeting && input.greeting.length > 200) {
      throw new ValidationError('Greeting cannot exceed 200 characters');
    }

    if (input.message && input.message.length > 5000) {
      throw new ValidationError('Message cannot exceed 5000 characters');
    }

    if (input.signature && input.signature.length > 500) {
      throw new ValidationError('Signature cannot exceed 500 characters');
    }
  }

  private async buildHtmlContent(input: SaveDraftInput): Promise<string> {
    // Build a temporary unsubscribe URL for preview
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soundcloud-brevo.vercel.app';
    const tempUnsubscribeUrl = `${baseUrl}/unsubscribe?token=TEMP_TOKEN`;

    return await render(
      CustomEmail({
        greeting: input.greeting,
        message: input.message,
        signature: input.signature,
        coverImage: input.coverImage || '',
        unsubscribeUrl: tempUnsubscribeUrl
      })
    );
  }

  private async createNewDraft(input: SaveDraftInput, htmlContent: string): Promise<SaveDraftResult> {
    const campaign = await this.campaignRepository.create({
      templateId: input.templateId || null,
      trackId: input.trackId || null,
      subject: input.subject,
      htmlContent,
      status: 'draft',
      scheduledAt: input.scheduledAt || null
    });

    console.log(`Draft created successfully: ${campaign.id}`);

    return {
      success: true,
      campaignId: campaign.id,
      isNew: true
    };
  }

  private async updateExistingDraft(
    id: string,
    input: SaveDraftInput,
    htmlContent: string
  ): Promise<SaveDraftResult> {
    // 1. Check if draft exists
    const existingCampaign = await this.campaignRepository.findById(id);

    if (!existingCampaign) {
      throw new ValidationError(`Draft with ID ${id} not found`);
    }

    // 2. Ensure it's a draft (can't update sent campaigns)
    if (existingCampaign.status === 'sent') {
      throw new ValidationError('Cannot update a sent campaign');
    }

    // 3. Update the draft
    const updatedCampaign = await this.campaignRepository.update({
      id,
      subject: input.subject,
      htmlContent,
      scheduledAt: input.scheduledAt
    });

    console.log(`Draft updated successfully: ${updatedCampaign.id}`);

    return {
      success: true,
      campaignId: updatedCampaign.id,
      isNew: false
    };
  }

  /**
   * Delete a draft
   */
  async deleteDraft(id: string): Promise<void> {
    // 1. Check if draft exists
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new ValidationError(`Draft with ID ${id} not found`);
    }

    // 2. Ensure it's a draft (can't delete sent campaigns through this method)
    if (campaign.status === 'sent') {
      throw new ValidationError('Cannot delete a sent campaign through this method');
    }

    // 3. Delete the draft
    await this.campaignRepository.delete(id);
    console.log(`Draft deleted successfully: ${id}`);
  }
}
