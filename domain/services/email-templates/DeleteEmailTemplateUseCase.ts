/**
 * DeleteEmailTemplateUseCase
 *
 * Soft deletes an email template.
 * Prevents deletion of default template.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template deletion
 * - Dependency Inversion: Depends on IEmailTemplateRepository interface
 */

import { IEmailTemplateRepository } from '../../repositories/IEmailTemplateRepository';
import { ValidationError } from './CreateEmailTemplateUseCase';

export interface DeleteEmailTemplateInput {
  id: string;
}

export interface DeleteEmailTemplateOutput {
  success: boolean;
  message: string;
}

export class DeleteEmailTemplateUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Execute the use case
   * @param input Template ID to delete
   * @returns Success status
   * @throws ValidationError if template is default or not found
   */
  async execute(input: DeleteEmailTemplateInput): Promise<DeleteEmailTemplateOutput> {
    // 1. Validate input
    if (!input.id || input.id.trim().length === 0) {
      throw new ValidationError('Template ID is required');
    }

    // 2. Find template
    const template = await this.templateRepository.findById(input.id);
    if (!template) {
      throw new ValidationError(`Template with ID ${input.id} not found`);
    }

    if (!template.isActive()) {
      throw new ValidationError('Template is already deleted');
    }

    // 3. Prevent deletion of default template
    if (template.isDefault) {
      throw new ValidationError('Cannot delete default template. Set another template as default first.');
    }

    // 4. Soft delete the template
    await this.templateRepository.delete(input.id);

    return {
      success: true,
      message: `Template "${template.name}" has been deleted`
    };
  }
}
