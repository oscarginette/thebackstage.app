/**
 * GetEmailTemplatesUseCase
 *
 * Retrieves email templates with optional filtering.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template retrieval logic
 * - Dependency Inversion: Depends on IEmailTemplateRepository interface
 */

import { EmailTemplate } from '../../entities/EmailTemplate';
import { IEmailTemplateRepository, FindTemplatesOptions } from '../../repositories/IEmailTemplateRepository';

export interface GetEmailTemplatesInput {
  includeDeleted?: boolean;
  onlyDefault?: boolean;
}

export interface GetEmailTemplatesOutput {
  templates: EmailTemplate[];
  count: number;
}

export class GetEmailTemplatesUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Execute the use case - get all templates
   * @param input Query options
   * @returns List of templates
   */
  async execute(input: GetEmailTemplatesInput = {}): Promise<GetEmailTemplatesOutput> {
    const options: FindTemplatesOptions = {
      includeDeleted: input.includeDeleted || false,
      onlyDefault: input.onlyDefault || false
    };

    const templates = await this.templateRepository.findAll(options);

    return {
      templates,
      count: templates.length
    };
  }

  /**
   * Get a single template by ID
   * @param id Template UUID
   * @returns Template or null
   */
  async getById(id: string): Promise<EmailTemplate | null> {
    return await this.templateRepository.findById(id);
  }

  /**
   * Get the default template
   * @returns Default template or null
   */
  async getDefault(): Promise<EmailTemplate | null> {
    return await this.templateRepository.findDefault();
  }

  /**
   * Get template versions
   * @param templateId Template UUID
   * @returns Array of template versions
   */
  async getVersions(templateId: string): Promise<EmailTemplate[]> {
    return await this.templateRepository.findVersions(templateId);
  }

  /**
   * Search templates by name
   * @param name Name to search for
   * @returns Matching templates
   */
  async searchByName(name: string): Promise<EmailTemplate[]> {
    if (!name || name.trim().length === 0) {
      return [];
    }

    return await this.templateRepository.findByName(name);
  }
}
