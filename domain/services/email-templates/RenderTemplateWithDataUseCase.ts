/**
 * RenderTemplateWithDataUseCase
 *
 * Renders an email template with dynamic data injection.
 * Replaces variables like {{trackName}}, {{coverImage}}, etc.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles template rendering with data
 * - Open/Closed: Can be extended with new variable types without modification
 */

import { IEmailTemplateRepository } from '../../repositories/IEmailTemplateRepository';
import { ValidationError } from './CreateEmailTemplateUseCase';

export interface TemplateData {
  // Track data
  trackName?: string;
  trackUrl?: string;
  coverImage?: string;

  // Custom content
  greeting?: string;
  message?: string;
  signature?: string;

  // Contact data
  contactName?: string;
  contactEmail?: string;

  // System data
  unsubscribeUrl: string;

  // Any other custom variables
  [key: string]: any;
}

export interface RenderTemplateInput {
  templateId: string;
  data: TemplateData;
}

export interface RenderTemplateOutput {
  html: string;
  subject?: string;
}

export class RenderTemplateWithDataUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Execute the use case
   * @param input Template ID and data to inject
   * @returns Rendered HTML
   * @throws ValidationError if template not found
   */
  async execute(input: RenderTemplateInput): Promise<RenderTemplateOutput> {
    // 1. Validate input
    if (!input.templateId || input.templateId.trim().length === 0) {
      throw new ValidationError('Template ID is required');
    }

    if (!input.data) {
      throw new ValidationError('Template data is required');
    }

    // 2. Get template
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new ValidationError(`Template with ID ${input.templateId} not found`);
    }

    if (!template.isActive()) {
      throw new ValidationError('Cannot render deleted template');
    }

    // 3. Get pre-compiled HTML snapshot
    let html = template.htmlSnapshot;

    // 4. Inject variables
    html = this.injectVariables(html, input.data);

    // 5. Extract subject if exists (from metadata or default)
    const subject = this.extractSubject(template, input.data);

    return {
      html,
      subject
    };
  }

  /**
   * Inject template variables into HTML
   * Replaces {{variableName}} with actual values
   * @private
   */
  private injectVariables(html: string, data: TemplateData): string {
    let result = html;

    // Replace all {{variable}} patterns
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const pattern = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(pattern, String(value));
      }
    });

    // Clean up any remaining unreplaced variables (replace with empty string)
    result = result.replace(/{{[^}]+}}/g, '');

    return result;
  }

  /**
   * Extract subject from template or data
   * @private
   */
  private extractSubject(template: any, data: TemplateData): string | undefined {
    // Try to extract from MJML head > mj-title
    try {
      const mjml = template.mjmlContent as any;
      const head = mjml.children?.find((child: any) => child.tagName === 'mj-head');
      if (head) {
        const title = head.children?.find((child: any) => child.tagName === 'mj-title');
        if (title?.content) {
          return this.injectVariables(title.content, data);
        }
      }
    } catch (error) {
      console.error('Error extracting subject from template:', error);
    }

    // Fallback: use data.subject if provided
    return data.subject;
  }

  /**
   * Render template using default template if no ID provided
   */
  async renderWithDefault(data: TemplateData): Promise<RenderTemplateOutput> {
    const defaultTemplate = await this.templateRepository.findDefault();

    if (!defaultTemplate) {
      throw new ValidationError('No default template found');
    }

    return this.execute({
      templateId: defaultTemplate.id,
      data
    });
  }
}
