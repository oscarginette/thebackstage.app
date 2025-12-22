/**
 * PostgresConsentHistoryRepository
 *
 * PostgreSQL implementation of IConsentHistoryRepository
 */

import { sql } from '@/lib/db';
import {
  IConsentHistoryRepository,
  CreateConsentHistoryInput
} from '../../../domain/repositories/IConsentHistoryRepository';
import { ConsentHistory, ConsentAction } from '../../../domain/entities/ConsentHistory';

export class PostgresConsentHistoryRepository implements IConsentHistoryRepository {
  async create(input: CreateConsentHistoryInput): Promise<ConsentHistory> {
    const result = await sql`
      INSERT INTO consent_history (
        contact_id,
        action,
        timestamp,
        source,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        ${input.contactId},
        ${input.action},
        ${input.timestamp.toISOString()},
        ${input.source},
        ${input.ipAddress},
        ${input.userAgent},
        ${input.metadata ? JSON.stringify(input.metadata) : null}
      )
      RETURNING *
    `;

    const row = result.rows[0];
    return this.mapRowToEntity(row);
  }

  async findByContactId(contactId: number): Promise<ConsentHistory[]> {
    const result = await sql`
      SELECT * FROM consent_history
      WHERE contact_id = ${contactId}
      ORDER BY timestamp DESC
    `;

    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async findByAction(action: ConsentAction, limit = 100): Promise<ConsentHistory[]> {
    const result = await sql`
      SELECT * FROM consent_history
      WHERE action = ${action}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async getRecentUnsubscribes(days: number): Promise<ConsentHistory[]> {
    const result = await sql`
      SELECT * FROM consent_history
      WHERE action = 'unsubscribe'
      AND timestamp > NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;

    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async getContactTimeline(contactId: number): Promise<ConsentHistory[]> {
    const result = await sql`
      SELECT * FROM consent_history
      WHERE contact_id = ${contactId}
      ORDER BY timestamp ASC
    `;

    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async countByAction(
    action: ConsentAction,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    if (startDate && endDate) {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM consent_history
        WHERE action = ${action}
        AND timestamp >= ${startDate.toISOString()}
        AND timestamp <= ${endDate.toISOString()}
      `;
      return Number.parseInt(result.rows[0].count, 10);
    }

    if (startDate) {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM consent_history
        WHERE action = ${action}
        AND timestamp >= ${startDate.toISOString()}
      `;
      return Number.parseInt(result.rows[0].count, 10);
    }

    if (endDate) {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM consent_history
        WHERE action = ${action}
        AND timestamp <= ${endDate.toISOString()}
      `;
      return Number.parseInt(result.rows[0].count, 10);
    }

    const result = await sql`
      SELECT COUNT(*) as count
      FROM consent_history
      WHERE action = ${action}
    `;
    return Number.parseInt(result.rows[0].count, 10);
  }

  /**
   * Map database row to ConsentHistory entity
   */
  private mapRowToEntity(row: any): ConsentHistory {
    return new ConsentHistory(
      row.id,
      row.contact_id,
      row.action,
      new Date(row.timestamp),
      row.source,
      row.ip_address,
      row.user_agent,
      row.metadata,
      new Date(row.created_at)
    );
  }
}
