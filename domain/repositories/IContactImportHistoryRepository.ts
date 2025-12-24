/**
 * IContactImportHistoryRepository
 *
 * Repository interface for contact import history operations.
 * Tracks audit trail for all contact imports (CSV/JSON).
 *
 * Follows Dependency Inversion Principle (SOLID):
 * - Domain layer defines interface
 * - Infrastructure layer implements with PostgreSQL
 */

export interface ContactImportHistory {
  id: number;
  userId: number;
  originalFilename: string;
  fileSizeBytes: number | null;
  fileType: 'csv' | 'json';
  rowsTotal: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  columnMapping: Record<string, any> | null;
  status: 'pending' | 'parsing' | 'importing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  errorsDetail: Array<{ row: number; email: string; message: string }> | null;
}

export interface CreateImportHistoryInput {
  userId: number;
  originalFilename: string;
  fileSizeBytes: number | null;
  fileType: 'csv' | 'json';
  rowsTotal: number;
  columnMapping?: Record<string, any>;
}

export interface ImportResults {
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  status: 'completed' | 'failed';
  durationMs: number;
  errorMessage?: string;
  errorsDetail?: Array<{ row: number; email: string; message: string }>;
}

export interface IContactImportHistoryRepository {
  /**
   * Create a new import history record
   * Called at the start of an import operation
   */
  create(input: CreateImportHistoryInput): Promise<ContactImportHistory>;

  /**
   * Update import history with final results
   * Called when import completes (success or failure)
   */
  updateWithResults(importId: number, results: ImportResults): Promise<void>;

  /**
   * Update import status
   * Used for tracking progress: pending → parsing → importing → completed/failed
   */
  updateStatus(importId: number, status: ContactImportHistory['status']): Promise<void>;

  /**
   * Find import history for a user
   * Returns most recent imports (for audit trail)
   */
  findByUser(userId: number, limit?: number): Promise<ContactImportHistory[]>;

  /**
   * Find a specific import by ID
   * Used for detailed error inspection
   */
  findById(importId: number): Promise<ContactImportHistory | null>;
}
