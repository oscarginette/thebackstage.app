/**
 * DeleteCampaignUseCase
 *
 * Deletes an email campaign.
 * Only draft campaigns can be deleted.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles campaign deletion
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */

import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * Use case for deleting email campaigns
 *
 * Business Rules:
 * - Only draft campaigns can be deleted
 * - Sent campaigns cannot be deleted (GDPR compliance - audit trail)
 * - Campaign must exist before deletion
 * - Hard delete for drafts (no soft delete needed)
 *
 * GDPR Consideration:
 * Sent campaigns are preserved for audit trail and legal compliance.
 * They contain consent history and sending records that may be needed
 * for up to 7 years after sending.
 */
export class DeleteCampaignUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param id - Campaign UUID to delete
   * @throws NotFoundError if campaign doesn't exist
   * @throws ValidationError if campaign is sent
   */
  async execute(id: string): Promise<void> {
    // Check if campaign exists
    const campaign = await this.campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundError(`Campaign with ID ${id} not found`);
    }

    // Business rule: Only drafts can be deleted
    // Sent campaigns must be preserved for GDPR audit trail
    if (campaign.status === 'sent') {
      throw new ValidationError(
        'Cannot delete a sent campaign. Sent campaigns must be preserved for audit purposes (GDPR compliance).'
      );
    }

    // Delete the draft campaign
    await this.campaignRepository.delete(id);
  }
}
