/**
 * UpdateEmailTemplateUseCase
 *
 * Updates an existing email template.
 * Optionally creates a new version for significant changes.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template updates
 * - Dependency Inversion: Depends on IEmailTemplateRepository interface
 */

import { EmailTemplate } from '../../entities/EmailTemplate';
import { IEmailTemplateRepository } from '../../repositories/IEmailTemplateRepository';
import { ValidationError } from './CreateEmailTemplateUseCase';

export interface UpdateEmailTemplateInput {
  id: string;
  name?: string;
  description?: string | null;
  mjmlContent?: object;
  htmlSnapshot?: string;
  isDefault?: boolean;
  createNewVersion?: boolean; // If true, creates new version instead of updating
}

export interface UpdateEmailTemplateOutput {
  template: EmailTemplate;
  isNewVersion: boolean;
}

export class UpdateEmailTemplateUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Execute the use case
   * @param input Update data
   * @returns Updated template
   * @throws ValidationError if template not found or input invalid
   */
  async execute(input: UpdateEmailTemplateInput): Promise<UpdateEmailTemplateOutput> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Find existing template
    const existingTemplate = await this.templateRepository.findById(input.id);
    if (!existingTemplate) {
      throw new ValidationError(`Template with ID ${input.id} not found`);
    }

    if (!existingTemplate.isActive()) {
      throw new ValidationError('Cannot update deleted template');
    }

    // 3. Check if we should create a new version
    const shouldCreateVersion =
      input.createNewVersion === true &&
      (input.mjmlContent || input.htmlSnapshot);

    if (shouldCreateVersion) {
      return await this.createNewVersion(existingTemplate, input);
    }

    // 4. Update existing template
    return await this.updateExisting(existingTemplate, input);
  }

  /**
   * Create a new version of the template
   * @private
   */
  private async createNewVersion(
    existingTemplate: EmailTemplate,
    input: UpdateEmailTemplateInput
  ): Promise<UpdateEmailTemplateOutput> {
    if (!input.mjmlContent || !input.htmlSnapshot) {
      throw new ValidationError('Both mjmlContent and htmlSnapshot required for new version');
    }

    const newVersion = await this.templateRepository.createVersion(
      existingTemplate.id,
      input.mjmlContent,
      input.htmlSnapshot
    );

    return {
      template: newVersion,
      isNewVersion: true
    };
  }

  /**
   * Update existing template in-place
   * @private
   */
  private async updateExisting(
    existingTemplate: EmailTemplate,
    input: UpdateEmailTemplateInput
  ): Promise<UpdateEmailTemplateOutput> {
    // Check for name conflicts if name is being changed
    if (input.name && input.name !== existingTemplate.name) {
      const existingWithName = await this.templateRepository.findByName(input.name);
      const conflicts = existingWithName.filter(t => t.id !== input.id);
      if (conflicts.length > 0) {
        throw new ValidationError(`Template with name "${input.name}" already exists`);
      }
    }

    // Validate MJML if being updated
    if (input.mjmlContent) {
      this.validateMJMLStructure(input.mjmlContent);
    }

    // Update the template
    const updatedTemplate = await this.templateRepository.update({
      id: input.id,
      name: input.name,
      description: input.description,
      mjmlContent: input.mjmlContent,
      htmlSnapshot: input.htmlSnapshot,
      isDefault: input.isDefault
    });

    return {
      template: updatedTemplate,
      isNewVersion: false
    };
  }

  /**
   * Validate input data
   * @private
   */
  private validateInput(input: UpdateEmailTemplateInput): void {
    if (!input.id || input.id.trim().length === 0) {
      throw new ValidationError('Template ID is required');
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new ValidationError('Template name cannot be empty');
    }

    if (input.name && input.name.length > 200) {
      throw new ValidationError('Template name cannot exceed 200 characters');
    }
  }

  /**
   * Validate MJML JSON structure
   * @private
   */
  private validateMJMLStructure(mjmlContent: object): void {
    const mjml = mjmlContent as any;

    if (!mjml.tagName || mjml.tagName !== 'mjml') {
      throw new ValidationError('MJML content must have root tagName "mjml"');
    }

    if (!mjml.children || !Array.isArray(mjml.children)) {
      throw new ValidationError('MJML content must have children array');
    }
  }
}
