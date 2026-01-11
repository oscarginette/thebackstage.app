/**
 * CreateCampaignUseCase
 *
 * Creates a new email campaign or draft.
 * Validates required fields before creation.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles campaign creation
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */

import {
  IEmailCampaignRepository,
  EmailCampaign,
  CreateCampaignInput
} from '@/domain/repositories/IEmailCampaignRepository';
import { ValidationError } from '@/lib/errors';

export interface CreateCampaignResult {
  campaign: EmailCampaign;
  success: boolean;
}

/**
 * Use case for creating email campaigns
 *
 * Business Rules:
 * - Subject is required and cannot be empty
 * - HTML content is required and cannot be empty
 * - Status defaults to 'draft' if not specified
 * - Template ID and Track ID are optional
 * - Scheduled campaigns must have future date
 */
export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param input - Campaign creation data (including userId for multi-tenant)
   * @returns Created campaign
   * @throws ValidationError if validation fails
   */
  async execute(input: CreateCampaignInput): Promise<CreateCampaignResult> {
    // Validate input
    this.validateInput(input);

    // Create campaign with user isolation
    const campaign = await this.campaignRepository.create({
      userId: input.userId,
      templateId: input.templateId || null,
      trackId: input.trackId || null,
      subject: input.subject,
      htmlContent: input.htmlContent,
      status: input.status || 'draft',
      scheduledAt: input.scheduledAt || null
    });

    return {
      campaign,
      success: true
    };
  }

  /**
   * Validate campaign creation input
   *
   * Business Rules:
   * - Subject must be present and non-empty
   * - HTML content must be present and non-empty
   * - Subject cannot exceed 500 characters
   * - Scheduled date must be in the future (if provided)
   */
  private validateInput(input: CreateCampaignInput): void {
    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }

    if (input.subject.length > 500) {
      throw new ValidationError('Subject cannot exceed 500 characters');
    }

    if (!input.htmlContent || input.htmlContent.trim().length === 0) {
      throw new ValidationError('HTML content is required');
    }

    // Validate scheduled date is in the future
    if (input.scheduledAt) {
      const now = new Date();
      if (input.scheduledAt <= now) {
        throw new ValidationError('Scheduled date must be in the future');
      }
    }
  }
}
