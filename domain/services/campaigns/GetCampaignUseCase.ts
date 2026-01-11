/**
 * GetCampaignUseCase
 *
 * Retrieves a single email campaign by ID.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles single campaign retrieval
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */

import {
  IEmailCampaignRepository,
  EmailCampaign
} from '@/domain/repositories/IEmailCampaignRepository';
import { NotFoundError } from '@/lib/errors';

/**
 * Use case for retrieving a single email campaign
 *
 * Business Rules:
 * - Returns campaign if found
 * - Returns null if campaign doesn't exist
 */
export class GetCampaignUseCase {
  constructor(
    private readonly campaignRepository: IEmailCampaignRepository
  ) {}

  /**
   * Execute the use case
   *
   * @param id - Campaign UUID
   * @returns Campaign or null if not found
   */
  async execute(id: string): Promise<EmailCampaign | null> {
    return await this.campaignRepository.findById(id);
  }
}
