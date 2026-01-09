/**
 * IBrevoIntegrationRepository
 *
 * Repository interface for Brevo integration operations.
 * Manages API key storage, integration status, and account information.
 *
 * Follows Dependency Inversion Principle (SOLID):
 * - Domain layer defines interface
 * - Infrastructure layer implements with PostgreSQL
 */

export interface BrevoIntegration {
  id: number;
  userId: number;
  apiKeyEncrypted: string;
  accountEmail: string | null;
  accountName: string | null;
  companyName: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrevoIntegrationStatus {
  connected: boolean;
  integration?: {
    id: number;
    accountEmail: string;
    accountName: string;
    companyName: string | null;
    connectedAt: Date;
    lastSyncAt: Date | null;
    lastError: string | null;
    stats: {
      contactsFromBrevo: number;
      totalImports: number;
      lastSuccessfulImport: Date | null;
    };
  };
}

export interface CreateBrevoIntegrationInput {
  userId: number;
  apiKeyEncrypted: string;
  accountEmail: string;
  accountName: string;
  companyName: string | null;
}

export interface UpdateBrevoIntegrationInput {
  apiKeyEncrypted?: string;
  accountEmail?: string;
  accountName?: string;
  companyName?: string | null;
  lastSyncAt?: Date;
  lastError?: string | null;
}

export interface IBrevoIntegrationRepository {
  /**
   * Create or update a Brevo integration for a user
   * If integration exists, updates API key and account info
   * @param input - Integration data including encrypted API key
   * @returns Created or updated integration
   */
  upsert(input: CreateBrevoIntegrationInput): Promise<BrevoIntegration>;

  /**
   * Find active Brevo integration for a user
   * @param userId - User identifier
   * @returns Integration if found and active, null otherwise
   */
  findByUserId(userId: number): Promise<BrevoIntegration | null>;

  /**
   * Get detailed integration status with stats
   * Includes contact counts, import history, and last sync info
   * @param userId - User identifier
   * @returns Detailed integration status
   */
  getStatus(userId: number): Promise<BrevoIntegrationStatus>;

  /**
   * Check if user has an active Brevo integration
   * Lightweight check for authorization/validation
   * @param userId - User identifier
   * @returns True if user has active integration
   */
  hasActiveIntegration(userId: number): Promise<boolean>;

  /**
   * Deactivate integration (soft delete)
   * Clears API key but keeps historical data for audit
   * @param userId - User identifier
   * @returns True if integration was deactivated
   */
  deactivate(userId: number): Promise<boolean>;

  /**
   * Update integration metadata
   * Used after sync operations to update lastSyncAt or errors
   * @param userId - User identifier
   * @param updates - Fields to update
   */
  update(userId: number, updates: UpdateBrevoIntegrationInput): Promise<void>;

  /**
   * Update last sync timestamp
   * Called after successful import
   * @param integrationId - Integration identifier
   * @param syncedAt - Sync timestamp (defaults to now)
   */
  updateLastSync(integrationId: number, syncedAt?: Date): Promise<void>;

  /**
   * Record error for integration
   * Called when import fails
   * @param integrationId - Integration identifier
   * @param errorMessage - Error description
   */
  recordError(integrationId: number, errorMessage: string): Promise<void>;
}
