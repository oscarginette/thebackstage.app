/**
 * ImportPreview Entity
 *
 * Represents the preview of a parsed file before import confirmation.
 * Contains auto-detected column mappings and sample data.
 *
 * Used in the UI wizard to show user what will be imported
 * and allow them to verify/adjust column mappings.
 */

export interface DetectedColumn {
  /** Original column name from CSV header or JSON key */
  originalName: string;

  /** Auto-detected field mapping: email, name, subscribed, or null if unmapped */
  suggestedField: 'email' | 'name' | 'subscribed' | null;

  /** Sample values from first rows (for user verification) */
  sampleValues: string[];

  /** Confidence score 0-100 (based on header match + content validation) */
  confidence: number;
}

export class ImportPreview {
  constructor(
    public readonly filename: string,
    public readonly fileType: 'csv' | 'json' | 'brevo',
    public readonly totalRows: number,
    public readonly detectedColumns: DetectedColumn[],
    public readonly sampleRows: any[], // First 5 rows for preview
    public readonly rawData: any[] // Full parsed data (for execute step)
  ) {
    this.validate();
  }

  /**
   * Validates preview data
   * Ensures minimum requirements are met
   */
  private validate(): void {
    if (this.totalRows === 0) {
      throw new Error('File is empty');
    }

    if (this.detectedColumns.length === 0) {
      throw new Error('No columns detected in file');
    }

    // Ensure at least one email candidate exists
    const hasEmailCandidate = this.detectedColumns.some(
      col => col.suggestedField === 'email' || col.confidence > 50
    );

    if (!hasEmailCandidate) {
      // Soft validation - user can still manually map
      console.warn('No email column auto-detected - user must manually select');
    }
  }

  /**
   * Get the auto-detected email column (highest confidence)
   * Returns null if no email column detected
   */
  getEmailColumn(): DetectedColumn | null {
    const emailColumns = this.detectedColumns.filter(
      col => col.suggestedField === 'email'
    );

    if (emailColumns.length === 0) return null;

    // Return highest confidence email column
    return emailColumns.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );
  }

  /**
   * Get the auto-detected name column
   */
  getNameColumn(): DetectedColumn | null {
    return this.detectedColumns.find(
      col => col.suggestedField === 'name'
    ) || null;
  }

  /**
   * Get the auto-detected subscribed column
   */
  getSubscribedColumn(): DetectedColumn | null {
    return this.detectedColumns.find(
      col => col.suggestedField === 'subscribed'
    ) || null;
  }

  /**
   * Get all unmapped columns (for metadata)
   */
  getUnmappedColumns(): DetectedColumn[] {
    return this.detectedColumns.filter(col => col.suggestedField === null);
  }

  /**
   * Factory method: Create preview from parsed data
   */
  static create(
    filename: string,
    fileType: 'csv' | 'json' | 'brevo',
    rawData: any[],
    detectedColumns: DetectedColumn[]
  ): ImportPreview {
    return new ImportPreview(
      filename,
      fileType,
      rawData.length,
      detectedColumns,
      rawData.slice(0, 5), // First 5 rows for preview
      rawData
    );
  }
}
