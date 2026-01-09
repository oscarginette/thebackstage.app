import { ImportedContact, ValidationError } from '@/domain/entities/ImportedContact';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';
import type { ContactMetadata } from '@/domain/types/metadata';
import { parseDate, isDateColumn } from '@/domain/utils/date-parser';

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

        // Extract created_at date from date columns (optional)
        const createdAt = this.extractCreatedAt(row, mapping);

        // Extract metadata from unmapped columns
        const metadata = this.extractMetadata(row, mapping, createdAt);

        // Create ImportedContact entity (validates internally)
        const contact = ImportedContact.create(
          email,
          name,
          subscribed,
          metadata,
          rowNumber,
          createdAt
        );

        validContacts.push(contact);
      } catch (error: unknown) {
        // Validation error - collect for user feedback
        if (error instanceof ValidationError) {
          errors.push({
            row: error.rowNumber,
            email: error.email,
            message: error.message
          });
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
          errors.push({
            row: rowNumber,
            email: '',
            message: errorMessage
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
   * Extract created_at date from date-like columns
   * Automatically detects columns with date keywords and parses them
   * Supports relative dates ("7 months ago"), ISO dates, and standard formats
   *
   * Returns null if no date column found or unparseable
   */
  private extractCreatedAt(row: any, mapping: ColumnMapping): Date | null {
    // Look through all available columns for date-like columns
    const allColumns = Object.keys(row);

    // Priority 1: Look for specific date column names
    const dateColumnPriority = [
      'created_at',
      'created',
      'date_created',
      'contact_since',
      'contactsince',
      'since',
      'joined',
      'date_joined',
      'signup_date',
      'subscribed_at',
      'added',
      'date_added'
    ];

    // Find first matching column
    for (const priorityColumn of dateColumnPriority) {
      const matchingColumn = allColumns.find(
        col => col.toLowerCase().replace(/[_\s-]/g, '') === priorityColumn.replace(/[_\s-]/g, '')
      );

      if (matchingColumn) {
        const value = row[matchingColumn];
        const parsedDate = parseDate(value);

        if (parsedDate) {
          return parsedDate;
        }
      }
    }

    // Priority 2: Look for any column with date keywords
    const dateColumn = allColumns.find(col => isDateColumn(col));

    if (dateColumn) {
      const value = row[dateColumn];
      const parsedDate = parseDate(value);

      if (parsedDate) {
        return parsedDate;
      }
    }

    return null;
  }

  /**
   * Extract metadata from unmapped columns
   * Creates JSONB-compatible object
   * Excludes the date column used for created_at
   */
  private extractMetadata(row: any, mapping: ColumnMapping, createdAt: Date | null): ContactMetadata {
    const metadata: ContactMetadata = {};

    // Get all unmapped columns (not email, name, or subscribed)
    for (const columnName of mapping.metadataColumns) {
      const value = row[columnName];

      if (value !== null && value !== undefined && value !== '') {
        // If this column was used for created_at, store original value for reference
        if (createdAt && isDateColumn(columnName)) {
          metadata[columnName] = value; // Keep original value like "7 months ago"
        } else {
          metadata[columnName] = value;
        }
      }
    }

    return metadata;
  }
}
