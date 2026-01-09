/**
 * PostgresBrevoIntegrationRepository
 *
 * PostgreSQL implementation of IBrevoIntegrationRepository.
 * Manages Brevo API key storage, integration status, and account information.
 *
 * Follows Clean Architecture pattern with dependency inversion.
 */

import { sql } from '@/lib/db';
import {
  IBrevoIntegrationRepository,
  BrevoIntegration,
  BrevoIntegrationStatus,
  CreateBrevoIntegrationInput,
  UpdateBrevoIntegrationInput
} from '@/domain/repositories/IBrevoIntegrationRepository';

/**
 * Database row type for brevo_integrations table
 * Maps snake_case DB columns to TypeScript type
 *
 * Clean Code: Explicit types prevent runtime errors
 */
interface BrevoIntegrationRow {
  id: number;
  user_id: number;
  api_key_encrypted: string;
  account_email: string | null;
  account_name: string | null;
  company_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for integration status query
 * Includes aggregated stats from related tables
 */
interface BrevoIntegrationStatusRow extends BrevoIntegrationRow {
  contacts_from_brevo: string;
  total_imports: string;
  last_successful_import: string | null;
}

export class PostgresBrevoIntegrationRepository implements IBrevoIntegrationRepository {
  async upsert(input: CreateBrevoIntegrationInput): Promise<BrevoIntegration> {
    const result = await sql`
      INSERT INTO brevo_integrations (
        user_id,
        api_key_encrypted,
        account_email,
        account_name,
        company_name,
        is_active,
        updated_at
      )
      VALUES (
        ${input.userId},
        ${input.apiKeyEncrypted},
        ${input.accountEmail},
        ${input.accountName},
        ${input.companyName},
        true,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        api_key_encrypted = EXCLUDED.api_key_encrypted,
        account_email = EXCLUDED.account_email,
        account_name = EXCLUDED.account_name,
        company_name = EXCLUDED.company_name,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP,
        last_error = NULL
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to upsert Brevo integration');
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserId(userId: number): Promise<BrevoIntegration | null> {
    const result = await sql`
      SELECT *
      FROM brevo_integrations
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async getStatus(userId: number): Promise<BrevoIntegrationStatus> {
    const result = await sql`
      SELECT
        bi.id,
        bi.user_id,
        bi.api_key_encrypted,
        bi.account_email,
        bi.account_name,
        bi.company_name,
        bi.is_active,
        bi.last_sync_at,
        bi.last_error,
        bi.created_at,
        bi.updated_at,
        COUNT(c.id) FILTER (WHERE c.brevo_id IS NOT NULL) as contacts_from_brevo,
        (
          SELECT COUNT(*)
          FROM brevo_import_history bih
          WHERE bih.integration_id = bi.id
        ) as total_imports,
        (
          SELECT MAX(started_at)
          FROM brevo_import_history bih
          WHERE bih.integration_id = bi.id AND bih.status = 'completed'
        ) as last_successful_import
      FROM brevo_integrations bi
      LEFT JOIN contacts c ON c.user_id = bi.user_id
      WHERE bi.user_id = ${userId}
      GROUP BY bi.id
    `;

    if (result.rows.length === 0) {
      return { connected: false };
    }

    const integration = result.rows[0] as BrevoIntegrationStatusRow;

    if (!integration.is_active) {
      return { connected: false };
    }

    return {
      connected: true,
      integration: {
        id: integration.id,
        accountEmail: integration.account_email || '',
        accountName: integration.account_name || '',
        companyName: integration.company_name,
        connectedAt: new Date(integration.created_at),
        lastSyncAt: integration.last_sync_at ? new Date(integration.last_sync_at) : null,
        lastError: integration.last_error,
        stats: {
          contactsFromBrevo: parseInt(integration.contacts_from_brevo || '0', 10),
          totalImports: parseInt(integration.total_imports || '0', 10),
          lastSuccessfulImport: integration.last_successful_import
            ? new Date(integration.last_successful_import)
            : null
        }
      }
    };
  }

  async hasActiveIntegration(userId: number): Promise<boolean> {
    const result = await sql`
      SELECT 1
      FROM brevo_integrations
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `;

    return result.rows.length > 0;
  }

  async deactivate(userId: number): Promise<boolean> {
    const result = await sql`
      UPDATE brevo_integrations
      SET
        is_active = false,
        api_key_encrypted = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING id
    `;

    return result.rowCount > 0;
  }

  async update(userId: number, updates: UpdateBrevoIntegrationInput): Promise<void> {
    // Fetch current integration first
    const current = await this.findByUserId(userId);
    if (!current) {
      throw new Error('Brevo integration not found');
    }

    // Apply updates (use current values as defaults)
    const apiKeyEncrypted = updates.apiKeyEncrypted ?? current.apiKeyEncrypted;
    const accountEmail = updates.accountEmail ?? current.accountEmail;
    const accountName = updates.accountName ?? current.accountName;
    const companyName = updates.companyName !== undefined ? updates.companyName : current.companyName;
    const lastSyncAt = updates.lastSyncAt ?? current.lastSyncAt;
    const lastError = updates.lastError !== undefined ? updates.lastError : current.lastError;

    // Update all fields (simpler than dynamic SQL)
    await sql`
      UPDATE brevo_integrations
      SET
        api_key_encrypted = ${apiKeyEncrypted},
        account_email = ${accountEmail},
        account_name = ${accountName},
        company_name = ${companyName},
        last_sync_at = ${lastSyncAt ? lastSyncAt.toISOString() : null},
        last_error = ${lastError},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;
  }

  async updateLastSync(integrationId: number, syncedAt?: Date): Promise<void> {
    const timestamp = syncedAt || new Date();

    await sql`
      UPDATE brevo_integrations
      SET
        last_sync_at = ${timestamp.toISOString()},
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${integrationId}
    `;
  }

  async recordError(integrationId: number, errorMessage: string): Promise<void> {
    await sql`
      UPDATE brevo_integrations
      SET
        last_error = ${errorMessage},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${integrationId}
    `;
  }

  /**
   * Maps database row to domain entity
   * Converts snake_case to camelCase and handles type conversions
   *
   * Clean Architecture: Infrastructure layer converts DB format to Domain format
   */
  private mapRowToEntity(row: BrevoIntegrationRow): BrevoIntegration {
    return {
      id: row.id,
      userId: row.user_id,
      apiKeyEncrypted: row.api_key_encrypted,
      accountEmail: row.account_email,
      accountName: row.account_name,
      companyName: row.company_name,
      isActive: row.is_active,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
      lastError: row.last_error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
