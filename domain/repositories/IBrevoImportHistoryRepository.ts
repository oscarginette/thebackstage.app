/**
 * IBrevoImportHistoryRepository
 *
 * Repository interface for Brevo import history operations.
 * Tracks audit trail for all Brevo contact imports.
 *
 * Follows Dependency Inversion Principle (SOLID):
 * - Domain layer defines interface
 * - Infrastructure layer implements with PostgreSQL
 */

export interface BrevoImportHistory {
  id: number;
  userId: number;
  integrationId: number;
  contactsFetched: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  listsProcessed: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  errorsDetail: Array<string> | null;
  metadata: Record<string, unknown> | null;
  previewUsed: boolean;
}

export interface CreateBrevoImportHistoryInput {
  userId: number;
  integrationId: number;
  status?: 'pending' | 'running';
  previewUsed?: boolean;
}

export interface UpdateBrevoImportResults {
  contactsFetched: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  listsProcessed: number;
  status: 'completed' | 'failed';
  durationMs: number;
  errorMessage?: string;
  errorsDetail?: Array<string>;
}

export interface IBrevoImportHistoryRepository {
  /**
   * Create a new import history record
   * Called at the start of a Brevo import operation
   * @param input - Import metadata
   * @returns Created import history record
   */
  create(input: CreateBrevoImportHistoryInput): Promise<BrevoImportHistory>;

  /**
   * Update import history with final results
   * Called when import completes (success or failure)
   * @param importId - Import history identifier
   * @param results - Import results and statistics
   */
  updateWithResults(importId: number, results: UpdateBrevoImportResults): Promise<void>;

  /**
   * Update import status
   * Used for tracking progress: pending → running → completed/failed
   * @param importId - Import history identifier
   * @param status - New status
   */
  updateStatus(
    importId: number,
    status: BrevoImportHistory['status']
  ): Promise<void>;

  /**
   * Find import history for a user
   * Returns most recent imports (for audit trail and UI display)
   * @param userId - User identifier
   * @param limit - Maximum number of records to return (default: 10)
   * @returns Array of import history records, ordered by started_at DESC
   */
  findByUserId(userId: number, limit?: number): Promise<BrevoImportHistory[]>;

  /**
   * Find import history for an integration
   * Used for integration-specific stats
   * @param integrationId - Integration identifier
   * @param limit - Maximum number of records to return (default: 10)
   * @returns Array of import history records
   */
  findByIntegrationId(integrationId: number, limit?: number): Promise<BrevoImportHistory[]>;

  /**
   * Find a specific import by ID
   * Used for detailed error inspection
   * @param importId - Import history identifier
   * @returns Import history record or null if not found
   */
  findById(importId: number): Promise<BrevoImportHistory | null>;

  /**
   * Get latest import for a user
   * Quick lookup for "last import" display
   * @param userId - User identifier
   * @returns Most recent import or null
   */
  getLatestByUserId(userId: number): Promise<BrevoImportHistory | null>;

  /**
   * Get latest successful import for an integration
   * Used for "last sync" timestamp in status endpoint
   * @param integrationId - Integration identifier
   * @returns Most recent successful import or null
   */
  getLatestSuccessfulByIntegrationId(integrationId: number): Promise<BrevoImportHistory | null>;

  /**
   * Count total imports for a user
   * Used for stats display
   * @param userId - User identifier
   * @returns Total number of imports
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * Count total imports for an integration
   * Used for integration stats
   * @param integrationId - Integration identifier
   * @returns Total number of imports
   */
  countByIntegrationId(integrationId: number): Promise<number>;
}
