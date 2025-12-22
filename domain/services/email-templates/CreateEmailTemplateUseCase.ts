/**
 * CreateEmailTemplateUseCase
 *
 * Creates a new email template with MJML content.
 * Validates MJML structure and compiles to HTML.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template creation logic
 * - Dependency Inversion: Depends on IEmailTemplateRepository interface
 */

import { EmailTemplate } from '../../entities/EmailTemplate';
import { IEmailTemplateRepository } from '../../repositories/IEmailTemplateRepository';

export interface CreateEmailTemplateInput {
  name: string;
  description?: string;
  mjmlContent: object;
  htmlSnapshot: string;
  isDefault?: boolean;
}

export interface CreateEmailTemplateOutput {
  template: EmailTemplate;
  success: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateEmailTemplateUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Execute the use case
   * @param input Template creation data
   * @returns Created template
   * @throws ValidationError if input is invalid
   */
  async execute(input: CreateEmailTemplateInput): Promise<CreateEmailTemplateOutput> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Validate MJML structure
    this.validateMJMLStructure(input.mjmlContent);

    // 3. Check for duplicate name
    const existingTemplates = await this.templateRepository.findByName(input.name);
    if (existingTemplates.length > 0) {
      throw new ValidationError(`Template with name "${input.name}" already exists`);
    }

    // 4. If setting as default, verify no conflicts
    if (input.isDefault) {
      const currentDefault = await this.templateRepository.findDefault();
      if (currentDefault) {
        // Will be handled by repository (unset previous default)
        console.log(`Replacing default template: ${currentDefault.name}`);
      }
    }

    // 5. Create template entity
    const template = EmailTemplate.create({
      name: input.name,
      description: input.description,
      mjmlContent: input.mjmlContent,
      htmlSnapshot: input.htmlSnapshot,
      isDefault: input.isDefault
    });

    // 6. Persist to database
    const savedTemplate = await this.templateRepository.create({
      name: template.name,
      description: template.description ?? undefined,
      mjmlContent: template.mjmlContent,
      htmlSnapshot: template.htmlSnapshot,
      isDefault: template.isDefault
    });

    return {
      template: savedTemplate,
      success: true
    };
  }

  /**
   * Validate input data
   * @private
   */
  private validateInput(input: CreateEmailTemplateInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (input.name.length > 200) {
      throw new ValidationError('Template name cannot exceed 200 characters');
    }

    if (!input.mjmlContent) {
      throw new ValidationError('MJML content is required');
    }

    if (!input.htmlSnapshot || input.htmlSnapshot.trim().length === 0) {
      throw new ValidationError('HTML snapshot is required');
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

    // Validate required sections
    const hasBody = mjml.children.some((child: any) => child.tagName === 'mj-body');
    if (!hasBody) {
      throw new ValidationError('MJML content must include mj-body section');
    }
  }
}
