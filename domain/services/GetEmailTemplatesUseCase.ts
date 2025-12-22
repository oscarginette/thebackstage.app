/**
 * GetEmailTemplatesUseCase
 *
 * Use case for retrieving email templates.
 * Supports filtering by various criteria.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template retrieval logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IEmailTemplateRepository, FindTemplatesOptions } from '@/domain/repositories/IEmailTemplateRepository';
import { EmailTemplate } from '@/domain/entities/EmailTemplate';

export interface GetTemplatesInput {
  includeDeleted?: boolean;
  onlyDefault?: boolean;
  parentTemplateId?: string;
}

export class GetEmailTemplatesUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  /**
   * Get all templates based on filter criteria
   */
  async execute(input?: GetTemplatesInput): Promise<EmailTemplate[]> {
    const options: FindTemplatesOptions = {
      includeDeleted: input?.includeDeleted || false,
      onlyDefault: input?.onlyDefault || false,
      parentTemplateId: input?.parentTemplateId
    };

    const templates = await this.templateRepository.findAll(options);

    // Sort by creation date (newest first)
    return templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<EmailTemplate | null> {
    return await this.templateRepository.findById(id);
  }

  /**
   * Get default template
   */
  async getDefault(): Promise<EmailTemplate | null> {
    return await this.templateRepository.findDefault();
  }

  /**
   * Search templates by name
   */
  async searchByName(name: string): Promise<EmailTemplate[]> {
    if (!name || name.trim().length === 0) {
      return [];
    }

    const templates = await this.templateRepository.findByName(name);
    return templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get template versions
   */
  async getVersions(templateId: string): Promise<EmailTemplate[]> {
    return await this.templateRepository.findVersions(templateId);
  }

  /**
   * Get template count
   */
  async getCount(includeDeleted: boolean = false): Promise<number> {
    return await this.templateRepository.count(includeDeleted);
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(templateId: string): Promise<{
    totalEmailsSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }> {
    return await this.templateRepository.getUsageStats(templateId);
  }
}
