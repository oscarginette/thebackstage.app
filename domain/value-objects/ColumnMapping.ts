/**
 * ColumnMapping Value Object
 *
 * Immutable representation of user-confirmed column mapping.
 * Encapsulates validation rules for import column configuration.
 *
 * Value Object Pattern (SOLID):
 * - Immutable after creation
 * - Self-validating
 * - Equality based on values, not identity
 */
export class ColumnMapping {
  constructor(
    public readonly emailColumn: string,
    public readonly nameColumn: string | null,
    public readonly subscribedColumn: string | null,
    public readonly metadataColumns: string[]
  ) {
    this.validate();
  }

  /**
   * Validates column mapping
   * Ensures business rules are met
   *
   * Business Rules:
   * 1. Email column is required (cannot be empty)
   * 2. Column names must not overlap
   */
  private validate(): void {
    if (!this.emailColumn || this.emailColumn.trim() === '') {
      throw new Error('Email column is required');
    }

    // Validate no column is mapped twice
    const mappedColumns = [
      this.emailColumn,
      this.nameColumn,
      this.subscribedColumn,
      ...this.metadataColumns
    ].filter(Boolean) as string[];

    const uniqueColumns = new Set(mappedColumns);
    if (uniqueColumns.size !== mappedColumns.length) {
      throw new Error('Column names cannot be mapped to multiple fields');
    }
  }

  /**
   * Check if a column is mapped to a core field (email, name, subscribed)
   */
  isMappedToCoreField(columnName: string): boolean {
    return (
      columnName === this.emailColumn ||
      columnName === this.nameColumn ||
      columnName === this.subscribedColumn
    );
  }

  /**
   * Check if a column should be included in metadata
   */
  isMetadataColumn(columnName: string): boolean {
    return this.metadataColumns.includes(columnName);
  }

  /**
   * Get all mapped columns (excluding discarded)
   */
  getAllMappedColumns(): string[] {
    return [
      this.emailColumn,
      this.nameColumn,
      this.subscribedColumn,
      ...this.metadataColumns
    ].filter(Boolean) as string[];
  }

  /**
   * Factory method: Create from raw input with defaults
   */
  static create(
    emailColumn: string,
    nameColumn?: string | null,
    subscribedColumn?: string | null,
    metadataColumns?: string[]
  ): ColumnMapping {
    return new ColumnMapping(
      emailColumn,
      nameColumn || null,
      subscribedColumn || null,
      metadataColumns || []
    );
  }

  /**
   * Factory method: Create from auto-detected columns
   * Used when user accepts default mapping without changes
   */
  static fromDetected(
    detectedEmail: string,
    detectedName?: string | null,
    detectedSubscribed?: string | null,
    unmappedColumns: string[] = []
  ): ColumnMapping {
    return new ColumnMapping(
      detectedEmail,
      detectedName || null,
      detectedSubscribed || null,
      unmappedColumns
    );
  }

  /**
   * Serialize to JSON for storage
   */
  toJSON(): Record<string, any> {
    return {
      emailColumn: this.emailColumn,
      nameColumn: this.nameColumn,
      subscribedColumn: this.subscribedColumn,
      metadataColumns: this.metadataColumns
    };
  }
}
