/**
 * CreateEmailTemplateUseCase
 *
 * Use case for creating new email templates.
 * Supports both MJML-based templates and simple HTML templates.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template creation logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IEmailTemplateRepository, CreateTemplateInput } from '@/domain/repositories/IEmailTemplateRepository';
import { EmailTemplate } from '@/domain/entities/EmailTemplate';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CreateEmailTemplateUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<EmailTemplate> {
    // 1. Validate input
    this.validateInput(input);

    // 2. If setting as default, check current default
    if (input.isDefault) {
      const currentDefault = await this.templateRepository.findDefault();
      if (currentDefault) {
        console.log(`Template "${currentDefault.name}" will be replaced as default`);
      }
    }

    // 3. Create template
    const template = await this.templateRepository.create({
      name: input.name,
      description: input.description,
      mjmlContent: input.mjmlContent,
      htmlSnapshot: input.htmlSnapshot,
      isDefault: input.isDefault || false,
      parentTemplateId: input.parentTemplateId
    });

    // 4. If this is set as default, update the repository
    if (input.isDefault) {
      await this.templateRepository.setDefault(template.id);
    }

    return template;
  }

  private validateInput(input: CreateTemplateInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (input.name.length > 200) {
      throw new ValidationError('Template name cannot exceed 200 characters');
    }

    if (!input.mjmlContent || typeof input.mjmlContent !== 'object') {
      throw new ValidationError('MJML content must be a valid object');
    }

    if (!input.htmlSnapshot || input.htmlSnapshot.trim().length === 0) {
      throw new ValidationError('HTML snapshot is required');
    }

    // Validate MJML structure
    const mjml = input.mjmlContent as any;
    if (!mjml.tagName || mjml.tagName !== 'mjml') {
      throw new ValidationError('MJML content must have root tagName "mjml"');
    }
  }
}
