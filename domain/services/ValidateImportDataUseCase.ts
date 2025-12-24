import { ImportedContact, ValidationError } from '@/domain/entities/ImportedContact';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';

/**
 * ValidateImportDataUseCase
 *
 * Validates parsed import data with user-confirmed column mapping.
 * Creates ImportedContact entities for valid rows.
 *
 * Responsibility (SRP):
 * - Map columns to contact fields
 * - Validate email format and uniqueness
 * - Parse subscription status from various formats
 * - Collect validation errors for user feedback
 */

export interface ValidationResult {
  validContacts: ImportedContact[];
  errors: Array<{
    row: number;
    email: string;
    message: string;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export class ValidateImportDataUseCase {
  /**
   * Execute validation
   *
   * @param rawData - Parsed data rows
   * @param mapping - User-confirmed column mapping
   * @returns ValidationResult with valid contacts and errors
   */
  execute(rawData: any[], mapping: ColumnMapping): ValidationResult {
    const validContacts: ImportedContact[] = [];
    const errors: Array<{ row: number; email: string; message: string }> = [];
    const seenEmails = new Set<string>();

    // Process each row
    rawData.forEach((row, index) => {
      const rowNumber = index + 1; // 1-indexed for user display

      try {
        // Extract email (required)
        const email = this.extractEmail(row, mapping.emailColumn, rowNumber);

        // Check for duplicate within file
        const emailLower = email.toLowerCase();
        if (seenEmails.has(emailLower)) {
          errors.push({
            row: rowNumber,
            email: email,
            message: 'Duplicate email in file (only last occurrence will be imported)'
          });
          return; // Skip duplicate
        }
        seenEmails.add(emailLower);

        // Extract name (optional)
        const name = this.extractName(row, mapping.nameColumn);

        // Extract subscribed status (optional, defaults to true)
        const subscribed = this.extractSubscribed(row, mapping.subscribedColumn);

        // Extract metadata from unmapped columns
        const metadata = this.extractMetadata(row, mapping);

        // Create ImportedContact entity (validates internally)
        const contact = ImportedContact.create(
          email,
          name,
          subscribed,
          metadata,
          rowNumber
        );

        validContacts.push(contact);
      } catch (error: any) {
        // Validation error - collect for user feedback
        if (error instanceof ValidationError) {
          errors.push({
            row: error.rowNumber,
            email: error.email,
            message: error.message
          });
        } else {
          errors.push({
            row: rowNumber,
            email: '',
            message: error.message || 'Unknown validation error'
          });
        }
      }
    });

    return {
      validContacts,
      errors: errors.slice(0, 100), // Limit to first 100 errors
      summary: {
        total: rawData.length,
        valid: validContacts.length,
        invalid: errors.length
      }
    };
  }

  /**
   * Extract and validate email
   * Throws ValidationError if email is missing or invalid
   */
  private extractEmail(row: any, emailColumn: string, rowNumber: number): string {
    const email = row[emailColumn];

    if (!email || String(email).trim() === '') {
      throw new ValidationError('Email is required', rowNumber, '');
    }

    return String(email).trim();
  }

  /**
   * Extract name (optional)
   */
  private extractName(row: any, nameColumn: string | null): string | null {
    if (!nameColumn) return null;

    const name = row[nameColumn];

    if (!name || String(name).trim() === '') {
      return null;
    }

    return String(name).trim();
  }

  /**
   * Extract subscribed status
   * Parses boolean from various formats: true/false, yes/no, 1/0, y/n, active/inactive
   * Defaults to true if column not mapped
   */
  private extractSubscribed(row: any, subscribedColumn: string | null): boolean {
    if (!subscribedColumn) {
      return true; // Default: all imports are subscribed
    }

    const value = row[subscribedColumn];

    if (value === null || value === undefined || value === '') {
      return true; // Default to subscribed if empty
    }

    const normalized = String(value).toLowerCase().trim();

    // True values
    const trueValues = ['true', 'yes', 'y', '1', 'active', 'subscribed'];
    if (trueValues.includes(normalized)) {
      return true;
    }

    // False values
    const falseValues = ['false', 'no', 'n', '0', 'inactive', 'unsubscribed'];
    if (falseValues.includes(normalized)) {
      return false;
    }

    // Unparseable - default to true
    console.warn(`Unable to parse subscribed value "${value}", defaulting to true`);
    return true;
  }

  /**
   * Extract metadata from unmapped columns
   * Creates JSONB-compatible object
   */
  private extractMetadata(row: any, mapping: ColumnMapping): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Get all unmapped columns (not email, name, or subscribed)
    for (const columnName of mapping.metadataColumns) {
      const value = row[columnName];

      if (value !== null && value !== undefined && value !== '') {
        metadata[columnName] = value;
      }
    }

    return metadata;
  }
}
