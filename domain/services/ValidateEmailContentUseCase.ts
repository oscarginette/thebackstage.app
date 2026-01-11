/**
 * ValidateEmailContentUseCase
 *
 * Validates email content for draft saving requirements.
 * Follows Single Responsibility Principle - only validates email content.
 *
 * Business Rules:
 * - Subject is REQUIRED for all drafts
 * - Other fields are optional but have length constraints
 *
 * This Use Case can be used in real-time (as user types) or before save.
 */

import {
  EmailContentValidation,
  EmailContentToValidate,
  ValidationError
} from '@/domain/value-objects/EmailContentValidation';

export interface ValidateEmailContentInput {
  subject: string;
  greeting: string;
  message: string;
  signature: string;
}

export interface ValidateEmailContentResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: string;
  saveButtonTooltip: string;
}

export class ValidateEmailContentUseCase {
  /**
   * Execute validation
   *
   * Returns validation state that can be used by UI components
   * to show/hide errors, enable/disable buttons, etc.
   */
  execute(input: ValidateEmailContentInput): ValidateEmailContentResult {
    // Create validation value object
    const validation = new EmailContentValidation({
      subject: input.subject,
      greeting: input.greeting,
      message: input.message,
      signature: input.signature
    });

    // Return validation state
    return {
      isValid: validation.isValid(),
      errors: validation.getErrors(),
      summary: validation.getValidationSummary(),
      saveButtonTooltip: validation.getSaveButtonTooltip()
    };
  }

  /**
   * Validate a specific field
   *
   * Useful for real-time validation as user types
   */
  validateField(
    fieldName: 'subject' | 'greeting' | 'message' | 'signature',
    value: string,
    allContent: ValidateEmailContentInput
  ): ValidationError[] {
    const validation = new EmailContentValidation(allContent);
    return validation.getFieldErrors(fieldName);
  }
}
