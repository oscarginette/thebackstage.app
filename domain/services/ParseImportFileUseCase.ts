import Papa from 'papaparse';
import { ImportPreview, DetectedColumn } from '@/domain/entities/ImportPreview';

/**
 * ParseImportFileUseCase
 *
 * Parses CSV or JSON files and auto-detects column mappings.
 * Implements intelligent fuzzy matching for email, name, and subscribed fields.
 *
 * Responsibility (SRP):
 * - Parse file content (CSV or JSON)
 * - Auto-detect column mappings with confidence scores
 * - Return preview with sample data
 */
export class ParseImportFileUseCase {
  /**
   * Execute the parse operation
   *
   * @param fileContent - Raw file content as string
   * @param filename - Original filename (for file type detection)
   * @returns ImportPreview with auto-detected columns
   */
  execute(fileContent: string, filename: string): ImportPreview {
    const fileType = this.detectFileType(filename);

    if (fileType === 'csv') {
      return this.parseCSV(fileContent, filename);
    } else {
      return this.parseJSON(fileContent, filename);
    }
  }

  /**
   * Detect file type from filename extension
   */
  private detectFileType(filename: string): 'csv' | 'json' {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'json' ? 'json' : 'csv';
  }

  /**
   * Parse CSV file using PapaParse
   * Auto-detects delimiter (comma, semicolon, tab, pipe)
   */
  private parseCSV(content: string, filename: string): ImportPreview {
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }

    if (parsed.data.length === 0) {
      throw new Error('CSV file is empty');
    }

    const rawData = parsed.data as any[];
    const columnNames = Object.keys(rawData[0]);

    // Auto-detect columns
    const detectedColumns = this.detectColumns(columnNames, rawData);

    return ImportPreview.create(filename, 'csv', rawData, detectedColumns);
  }

  /**
   * Parse JSON file
   * Expects array of objects
   */
  private parseJSON(content: string, filename: string): ImportPreview {
    let rawData: any[];

    try {
      const parsed = JSON.parse(content);

      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of contact objects');
      }

      rawData = parsed;
    } catch (error: any) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }

    if (rawData.length === 0) {
      throw new Error('JSON file is empty');
    }

    const columnNames = Object.keys(rawData[0]);

    // Auto-detect columns
    const detectedColumns = this.detectColumns(columnNames, rawData);

    return ImportPreview.create(filename, 'json', rawData, detectedColumns);
  }

  /**
   * Auto-detect column mappings with confidence scoring
   *
   * Algorithm:
   * 1. Match column names against known patterns (fuzzy matching)
   * 2. Validate sample data content
   * 3. Calculate confidence score (0-100)
   */
  private detectColumns(columnNames: string[], rawData: any[]): DetectedColumn[] {
    return columnNames.map(columnName => {
      const sampleValues = this.getSampleValues(columnName, rawData, 3);

      // Detect email column
      const emailMatch = this.detectEmailColumn(columnName, sampleValues);
      if (emailMatch.confidence > 0) {
        return {
          originalName: columnName,
          suggestedField: 'email',
          sampleValues,
          confidence: emailMatch.confidence
        };
      }

      // Detect name column
      const nameMatch = this.detectNameColumn(columnName);
      if (nameMatch.confidence > 0) {
        return {
          originalName: columnName,
          suggestedField: 'name',
          sampleValues,
          confidence: nameMatch.confidence
        };
      }

      // Detect subscribed column
      const subscribedMatch = this.detectSubscribedColumn(columnName, sampleValues);
      if (subscribedMatch.confidence > 0) {
        return {
          originalName: columnName,
          suggestedField: 'subscribed',
          sampleValues,
          confidence: subscribedMatch.confidence
        };
      }

      // No match - unmapped column
      return {
        originalName: columnName,
        suggestedField: null,
        sampleValues,
        confidence: 0
      };
    });
  }

  /**
   * Detect email column with fuzzy matching
   */
  private detectEmailColumn(columnName: string, sampleValues: string[]): { confidence: number } {
    const normalized = columnName.toLowerCase().replace(/[_\s-]/g, '');

    // Exact matches (high confidence)
    const exactPatterns = ['email', 'mail', 'emailaddress'];
    if (exactPatterns.some(pattern => normalized === pattern)) {
      // Boost confidence if sample values contain @
      const hasEmailFormat = sampleValues.some(val => val && val.includes('@'));
      return { confidence: hasEmailFormat ? 95 : 85 };
    }

    // Partial matches (medium confidence)
    const partialPatterns = ['emailaddr', 'contactemail', 'subscriberemail', 'useremail'];
    if (partialPatterns.some(pattern => normalized.includes(pattern) || pattern.includes(normalized))) {
      const hasEmailFormat = sampleValues.some(val => val && val.includes('@'));
      return { confidence: hasEmailFormat ? 80 : 65 };
    }

    // Just check content (low confidence)
    if (sampleValues.every(val => val && val.includes('@'))) {
      return { confidence: 60 };
    }

    return { confidence: 0 };
  }

  /**
   * Detect name column with fuzzy matching
   */
  private detectNameColumn(columnName: string): { confidence: number } {
    const normalized = columnName.toLowerCase().replace(/[_\s-]/g, '');

    // Exact matches
    const exactPatterns = ['name', 'fullname', 'contactname'];
    if (exactPatterns.some(pattern => normalized === pattern)) {
      return { confidence: 80 };
    }

    // Partial matches
    const partialPatterns = ['firstname', 'lastname', 'fname', 'lname', 'subscribername'];
    if (partialPatterns.some(pattern => normalized.includes(pattern) || pattern.includes(normalized))) {
      return { confidence: 65 };
    }

    return { confidence: 0 };
  }

  /**
   * Detect subscribed column with fuzzy matching and content validation
   */
  private detectSubscribedColumn(columnName: string, sampleValues: string[]): { confidence: number } {
    const normalized = columnName.toLowerCase().replace(/[_\s-]/g, '');

    // Exact matches
    const exactPatterns = ['subscribed', 'subscription', 'status', 'optin', 'active'];
    const hasExactMatch = exactPatterns.some(pattern => normalized === pattern);

    // Check if sample values are boolean-like
    const booleanLikeValues = ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 'active', 'inactive', 'subscribed', 'unsubscribed'];
    const hasBooleanContent = sampleValues.every(val =>
      val && booleanLikeValues.includes(val.toString().toLowerCase())
    );

    if (hasExactMatch && hasBooleanContent) {
      return { confidence: 90 };
    }

    if (hasExactMatch) {
      return { confidence: 75 };
    }

    if (hasBooleanContent) {
      return { confidence: 60 };
    }

    return { confidence: 0 };
  }

  /**
   * Extract sample values from column
   * Returns first N non-empty values
   */
  private getSampleValues(columnName: string, rawData: any[], count: number): string[] {
    const values: string[] = [];

    for (const row of rawData) {
      const value = row[columnName];
      if (value !== null && value !== undefined && value !== '') {
        values.push(String(value));
        if (values.length >= count) break;
      }
    }

    return values;
  }
}
