/**
 * EmailContentValidation Value Object
 *
 * Encapsulates email content validation rules and state.
 * Follows Single Responsibility Principle - only handles validation logic.
 *
 * Business Rules:
 * - Subject: Required (min 1 char, max 500 chars)
 * - Greeting: Optional (max 200 chars)
 * - Message: Optional (max 5000 chars)
 * - Signature: Optional (max 500 chars)
 */

export interface ValidationError {
  field: 'subject' | 'greeting' | 'message' | 'signature';
  message: string;
  severity: 'error' | 'warning';
}

export interface EmailContentToValidate {
  subject: string;
  greeting: string;
  message: string;
  signature: string;
}

export class EmailContentValidation {
  private errors: ValidationError[] = [];

  constructor(private content: EmailContentToValidate) {
    this.validate();
  }

  /**
   * Validates all fields according to business rules
   */
  private validate(): void {
    this.errors = [];

    // Subject validation (REQUIRED)
    this.validateSubject();

    // Optional field validations (length limits only)
    this.validateGreeting();
    this.validateMessage();
    this.validateSignature();
  }

  private validateSubject(): void {
    const { subject } = this.content;

    if (!subject || subject.trim().length === 0) {
      this.errors.push({
        field: 'subject',
        message: 'Subject is required',
        severity: 'error'
      });
      return;
    }

    if (subject.length > 500) {
      this.errors.push({
        field: 'subject',
        message: 'Subject must be 500 characters or less',
        severity: 'error'
      });
    }
  }

  private validateGreeting(): void {
    const { greeting } = this.content;

    if (greeting.length > 200) {
      this.errors.push({
        field: 'greeting',
        message: 'Greeting must be 200 characters or less',
        severity: 'error'
      });
    }
  }

  private validateMessage(): void {
    const { message } = this.content;

    if (message.length > 5000) {
      this.errors.push({
        field: 'message',
        message: 'Message must be 5000 characters or less',
        severity: 'error'
      });
    }
  }

  private validateSignature(): void {
    const { signature } = this.content;

    if (signature.length > 500) {
      this.errors.push({
        field: 'signature',
        message: 'Signature must be 500 characters or less',
        severity: 'error'
      });
    }
  }

  /**
   * Check if validation passed (no errors)
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Get all validation errors
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: 'subject' | 'greeting' | 'message' | 'signature'): ValidationError[] {
    return this.errors.filter(error => error.field === field);
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldErrors(field: 'subject' | 'greeting' | 'message' | 'signature'): boolean {
    return this.getFieldErrors(field).length > 0;
  }

  /**
   * Get human-readable validation summary for tooltips
   */
  getValidationSummary(): string {
    if (this.isValid()) {
      return 'All fields are valid';
    }

    const errorMessages = this.errors.map(error => error.message);
    return errorMessages.join('. ');
  }

  /**
   * Get user-friendly message for disabled save button
   */
  getSaveButtonTooltip(): string {
    if (this.isValid()) {
      return 'Save draft';
    }

    const errorMessages = this.errors
      .filter(error => error.severity === 'error')
      .map(error => `• ${error.message}`);

    return `Cannot save draft:\n${errorMessages.join('\n')}`;
  }
}
