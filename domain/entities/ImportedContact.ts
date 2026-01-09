import { Email } from '@/domain/value-objects/Email';
import type { ContactMetadata } from '@/domain/types/metadata';

/**
 * ImportedContact Entity
 *
 * Represents a contact parsed from CSV/JSON before database insertion.
 * Encapsulates validation logic and business rules.
 *
 * Clean Architecture:
 * - Domain entity with NO external dependencies
 * - Self-validating (fails fast on construction)
 * - Immutable after creation
 */
export class ImportedContact {
  constructor(
    public readonly email: string,
    public readonly name: string | null,
    public readonly subscribed: boolean,
    public readonly metadata: ContactMetadata,
    public readonly rowNumber: number,
    public readonly createdAt: Date | null = null
  ) {
    this.validate();
  }

  /**
   * Validates contact data
   * Throws ValidationError if data is invalid
   *
   * Business Rules:
   * 1. Email must be valid format (delegated to Email value object)
   * 2. Name cannot exceed 100 characters
   */
  private validate(): void {
    // Email validation (throws if invalid)
    new Email(this.email);

    // Name length validation
    if (this.name && this.name.length > 100) {
      throw new ValidationError(
        `Name exceeds 100 characters (${this.name.length} chars)`,
        this.rowNumber,
        this.email
      );
    }
  }

  /**
   * Factory method: Create from raw data with defaults
   * Used by ParseImportFileUseCase after parsing CSV/JSON
   */
  static create(
    email: string,
    name: string | null,
    subscribed: boolean,
    metadata: ContactMetadata,
    rowNumber: number,
    createdAt: Date | null = null
  ): ImportedContact {
    return new ImportedContact(
      email.trim(),
      name ? name.trim() : null,
      subscribed,
      metadata,
      rowNumber,
      createdAt
    );
  }
}

/**
 * ValidationError
 *
 * Thrown when imported contact data is invalid.
 * Includes row number for user feedback.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly rowNumber: number,
    public readonly email: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
