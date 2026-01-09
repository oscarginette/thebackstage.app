/**
 * PostgresBrevoImportHistoryRepository
 *
 * PostgreSQL implementation of IBrevoImportHistoryRepository.
 * Tracks audit trail for all Brevo contact imports.
 *
 * Follows Clean Architecture pattern with dependency inversion.
 */

import { sql } from '@/lib/db';
import {
  IBrevoImportHistoryRepository,
  BrevoImportHistory,
  CreateBrevoImportHistoryInput,
  UpdateBrevoImportResults
} from '@/domain/repositories/IBrevoImportHistoryRepository';

/**
 * Database row type for brevo_import_history table
 * Maps snake_case DB columns to TypeScript type
 *
 * Clean Code: Explicit types prevent runtime errors
 */
interface BrevoImportHistoryRow {
  id: number;
  user_id: number;
  integration_id: number;
  contacts_fetched: number | null;
  contacts_inserted: number | null;
  contacts_updated: number | null;
  contacts_skipped: number | null;
  lists_processed: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  errors_detail: Array<string> | null;
  metadata: Record<string, unknown> | null;
  preview_used: boolean | null;
}

export class PostgresBrevoImportHistoryRepository implements IBrevoImportHistoryRepository {
  async create(input: CreateBrevoImportHistoryInput): Promise<BrevoImportHistory> {
    const result = await sql`
      INSERT INTO brevo_import_history (
        user_id,
        integration_id,
        status,
        started_at,
        preview_used
      )
      VALUES (
        ${input.userId},
        ${input.integrationId},
        ${input.status || 'running'},
        CURRENT_TIMESTAMP,
        ${input.previewUsed || false}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create Brevo import history');
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async updateWithResults(importId: number, results: UpdateBrevoImportResults): Promise<void> {
    await sql`
      UPDATE brevo_import_history
      SET
        contacts_fetched = ${results.contactsFetched},
        contacts_inserted = ${results.contactsInserted},
        contacts_updated = ${results.contactsUpdated},
        contacts_skipped = ${results.contactsSkipped},
        lists_processed = ${results.listsProcessed},
        status = ${results.status},
        completed_at = CURRENT_TIMESTAMP,
        duration_ms = ${results.durationMs},
        error_message = ${results.errorMessage || null},
        errors_detail = ${results.errorsDetail ? JSON.stringify(results.errorsDetail) : null}::jsonb
      WHERE id = ${importId}
    `;
  }

  async updateStatus(
    importId: number,
    status: BrevoImportHistory['status']
  ): Promise<void> {
    await sql`
      UPDATE brevo_import_history
      SET status = ${status}
      WHERE id = ${importId}
    `;
  }

  async findByUserId(userId: number, limit: number = 10): Promise<BrevoImportHistory[]> {
    const result = await sql`
      SELECT *
      FROM brevo_import_history
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: BrevoImportHistoryRow) => this.mapRowToEntity(row));
  }

  async findByIntegrationId(integrationId: number, limit: number = 10): Promise<BrevoImportHistory[]> {
    const result = await sql`
      SELECT *
      FROM brevo_import_history
      WHERE integration_id = ${integrationId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: BrevoImportHistoryRow) => this.mapRowToEntity(row));
  }

  async findById(importId: number): Promise<BrevoImportHistory | null> {
    const result = await sql`
      SELECT *
      FROM brevo_import_history
      WHERE id = ${importId}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async getLatestByUserId(userId: number): Promise<BrevoImportHistory | null> {
    const result = await sql`
      SELECT *
      FROM brevo_import_history
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async getLatestSuccessfulByIntegrationId(integrationId: number): Promise<BrevoImportHistory | null> {
    const result = await sql`
      SELECT *
      FROM brevo_import_history
      WHERE integration_id = ${integrationId} AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async countByUserId(userId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM brevo_import_history
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) return 0;

    return parseInt(result.rows[0].count, 10);
  }

  async countByIntegrationId(integrationId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM brevo_import_history
      WHERE integration_id = ${integrationId}
    `;

    if (result.rows.length === 0) return 0;

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Maps database row to domain entity
   * Converts snake_case to camelCase and handles type conversions
   *
   * Clean Architecture: Infrastructure layer converts DB format to Domain format
   */
  private mapRowToEntity(row: BrevoImportHistoryRow): BrevoImportHistory {
    return {
      id: row.id,
      userId: row.user_id,
      integrationId: row.integration_id,
      contactsFetched: row.contacts_fetched ?? 0,
      contactsInserted: row.contacts_inserted ?? 0,
      contactsUpdated: row.contacts_updated ?? 0,
      contactsSkipped: row.contacts_skipped ?? 0,
      listsProcessed: row.lists_processed ?? 0,
      status: row.status as 'pending' | 'running' | 'completed' | 'failed',
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      durationMs: row.duration_ms,
      errorMessage: row.error_message,
      errorsDetail: row.errors_detail,
      metadata: row.metadata,
      previewUsed: row.preview_used ?? false
    };
  }
}
