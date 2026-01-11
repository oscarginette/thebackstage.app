/**
 * UpdateCampaignUseCase
 *
 * Updates an existing email campaign.
 * Validates that only draft campaigns can be updated.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles campaign updates
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */

import {
  IEmailCampaignRepository,
  EmailCampaign,
  UpdateCampaignInput
} from '@/domain/repositories/IEmailCampaignRepository';
import { ValidationError, NotFoundError } from '@/lib/errors';

export interface UpdateCampaignResult {
  campaign: EmailCampaign;
  success: boolean;
}

/**
 * Use case for updating email campaigns
 *
 * Business Rules:
 * - Only draft campaigns can be updated
 * - Sent campaigns are immutable (GDPR compliance)
 * - Campaign must exist before updating
 * - Subject and HTML content follow same validation as creation
 */
export class UpdateCampaignUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param input - Campaign update data
   * @returns Updated campaign
   * @throws NotFoundError if campaign doesn't exist
   * @throws ValidationError if campaign is sent or validation fails
   */
  async execute(input: UpdateCampaignInput): Promise<UpdateCampaignResult> {
    // Check if campaign exists
    const existingCampaign = await this.campaignRepository.findById(input.id);

    if (!existingCampaign) {
      throw new NotFoundError(`Campaign with ID ${input.id} not found`);
    }

    // Business rule: Only drafts can be updated
    if (existingCampaign.status === 'sent') {
      throw new ValidationError('Cannot update a sent campaign. Sent campaigns are immutable for audit purposes.');
    }

    // Validate input
    this.validateInput(input);

    // Update campaign
    const campaign = await this.campaignRepository.update(input);

    return {
      campaign,
      success: true
    };
  }

  /**
   * Validate campaign update input
   *
   * Business Rules:
   * - Subject cannot exceed 500 characters (if provided)
   * - Subject cannot be empty (if provided)
   * - HTML content cannot be empty (if provided)
   * - Scheduled date must be in the future (if provided)
   */
  private validateInput(input: UpdateCampaignInput): void {
    if (input.subject !== undefined) {
      if (input.subject.trim().length === 0) {
        throw new ValidationError('Subject cannot be empty');
      }

      if (input.subject.length > 500) {
        throw new ValidationError('Subject cannot exceed 500 characters');
      }
    }

    if (input.htmlContent !== undefined) {
      if (input.htmlContent.trim().length === 0) {
        throw new ValidationError('HTML content cannot be empty');
      }
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
