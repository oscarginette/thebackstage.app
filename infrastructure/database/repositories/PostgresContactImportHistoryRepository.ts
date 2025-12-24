import { sql } from '@/lib/db';
import {
  IContactImportHistoryRepository,
  ContactImportHistory,
  CreateImportHistoryInput,
  ImportResults
} from '@/domain/repositories/IContactImportHistoryRepository';

/**
 * Database row type for contact_import_history table
 * Maps snake_case DB columns to TypeScript type
 *
 * Clean Code: Explicit types prevent runtime errors
 */
interface ContactImportHistoryRow {
  id: number;
  user_id: number;
  original_filename: string;
  file_size_bytes: number;
  file_type: string;
  rows_total: number;
  contacts_inserted: number | null;
  contacts_updated: number | null;
  contacts_skipped: number | null;
  column_mapping: any;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  errors_detail: any;
}

/**
 * PostgresContactImportHistoryRepository
 *
 * PostgreSQL implementation of contact import history repository.
 * Follows Clean Architecture pattern with dependency inversion.
 */
export class PostgresContactImportHistoryRepository implements IContactImportHistoryRepository {
  async create(input: CreateImportHistoryInput): Promise<ContactImportHistory> {
    const result = await sql`
      INSERT INTO contact_import_history (
        user_id,
        original_filename,
        file_size_bytes,
        file_type,
        rows_total,
        column_mapping,
        status
      )
      VALUES (
        ${input.userId},
        ${input.originalFilename},
        ${input.fileSizeBytes},
        ${input.fileType},
        ${input.rowsTotal},
        ${input.columnMapping ? JSON.stringify(input.columnMapping) : null}::jsonb,
        'pending'
      )
      RETURNING *
    `;

    return this.mapRowToEntity(result.rows[0]);
  }

  async updateWithResults(importId: number, results: ImportResults): Promise<void> {
    await sql`
      UPDATE contact_import_history
      SET
        contacts_inserted = ${results.contactsInserted},
        contacts_updated = ${results.contactsUpdated},
        contacts_skipped = ${results.contactsSkipped},
        status = ${results.status},
        completed_at = CURRENT_TIMESTAMP,
        duration_ms = ${results.durationMs},
        error_message = ${results.errorMessage || null},
        errors_detail = ${results.errorsDetail ? JSON.stringify(results.errorsDetail) : null}::jsonb
      WHERE id = ${importId}
    `;
  }

  async updateStatus(importId: number, status: ContactImportHistory['status']): Promise<void> {
    await sql`
      UPDATE contact_import_history
      SET status = ${status}
      WHERE id = ${importId}
    `;
  }

  async findByUser(userId: number, limit: number = 20): Promise<ContactImportHistory[]> {
    const result = await sql`
      SELECT *
      FROM contact_import_history
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: ContactImportHistoryRow) => this.mapRowToEntity(row));
  }

  async findById(importId: number): Promise<ContactImportHistory | null> {
    const result = await sql`
      SELECT *
      FROM contact_import_history
      WHERE id = ${importId}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Maps database row to domain entity
   * Converts snake_case to camelCase and handles type conversions
   *
   * Clean Architecture: Infrastructure layer converts DB format to Domain format
   */
  private mapRowToEntity(row: ContactImportHistoryRow): ContactImportHistory {
    return {
      id: row.id,
      userId: row.user_id,
      originalFilename: row.original_filename,
      fileSizeBytes: row.file_size_bytes,
      fileType: row.file_type as 'csv' | 'json',
      rowsTotal: row.rows_total,
      contactsInserted: row.contacts_inserted ?? 0,
      contactsUpdated: row.contacts_updated ?? 0,
      contactsSkipped: row.contacts_skipped ?? 0,
      columnMapping: row.column_mapping,
      status: row.status as 'pending' | 'parsing' | 'importing' | 'completed' | 'failed',
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      durationMs: row.duration_ms,
      errorMessage: row.error_message,
      errorsDetail: row.errors_detail
    };
  }
}
