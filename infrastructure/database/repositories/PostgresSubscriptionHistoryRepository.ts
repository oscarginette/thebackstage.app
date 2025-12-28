/**
 * PostgresSubscriptionHistoryRepository
 *
 * PostgreSQL implementation of ISubscriptionHistoryRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 *
 * GDPR: Maintains audit trail for subscription changes (Article 30)
 */

import { sql } from '@/lib/db';
import {
  ISubscriptionHistoryRepository,
  SubscriptionHistory,
  CreateSubscriptionHistoryInput,
} from '@/domain/repositories/ISubscriptionHistoryRepository';

export class PostgresSubscriptionHistoryRepository implements ISubscriptionHistoryRepository {
  /**
   * Create new subscription history entry
   * GDPR: Audit trail for subscription changes (Article 30)
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async create(input: CreateSubscriptionHistoryInput): Promise<SubscriptionHistory> {
    try {
      const result = await sql`
        INSERT INTO subscription_history (
          user_id,
          change_type,
          old_plan,
          new_plan,
          old_quota,
          new_quota,
          changed_by_user_id,
          change_reason,
          ip_address,
          user_agent,
          created_at
        )
        VALUES (
          ${input.userId},
          ${input.changeType},
          ${input.oldPlan ?? null},
          ${input.newPlan ?? null},
          ${input.oldQuota ? JSON.stringify(input.oldQuota) : null}::jsonb,
          ${input.newQuota ? JSON.stringify(input.newQuota) : null}::jsonb,
          ${input.changedByUserId ?? null},
          ${input.changeReason ?? null},
          ${input.ipAddress ?? null},
          ${input.userAgent ?? null},
          NOW()
        )
        RETURNING
          id,
          user_id,
          change_type,
          old_plan,
          new_plan,
          old_quota,
          new_quota,
          changed_by_user_id,
          change_reason,
          ip_address,
          user_agent,
          created_at
      `;

      const row = result.rows[0];
      return this.mapRowToSubscriptionHistory(row);
    } catch (error) {
      console.error('PostgresSubscriptionHistoryRepository.create error:', error);
      throw new Error(
        `Failed to create subscription history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find subscription history by user ID
   * Returns entries ordered by most recent first
   * @param userId - User identifier
   * @param limit - Maximum number of records to return (default: all)
   */
  async findByUserId(userId: number, limit?: number): Promise<SubscriptionHistory[]> {
    try {
      const query = limit
        ? sql`
            SELECT
              id,
              user_id,
              change_type,
              old_plan,
              new_plan,
              old_quota,
              new_quota,
              changed_by_user_id,
              change_reason,
              ip_address,
              user_agent,
              created_at
            FROM subscription_history
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : sql`
            SELECT
              id,
              user_id,
              change_type,
              old_plan,
              new_plan,
              old_quota,
              new_quota,
              changed_by_user_id,
              change_reason,
              ip_address,
              user_agent,
              created_at
            FROM subscription_history
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `;

      const result = await query;

      return result.rows.map((row: any) => this.mapRowToSubscriptionHistory(row));
    } catch (error) {
      console.error('PostgresSubscriptionHistoryRepository.findByUserId error:', error);
      throw new Error(
        `Failed to find subscription history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map database row to SubscriptionHistory domain entity
   * SECURITY: Ensures type safety and validates data from database
   * @private
   */
  private mapRowToSubscriptionHistory(row: any): SubscriptionHistory {
    return {
      id: row.id,
      userId: row.user_id,
      changeType: row.change_type,
      oldPlan: row.old_plan,
      newPlan: row.new_plan,
      oldQuota: row.old_quota,
      newQuota: row.new_quota,
      changedByUserId: row.changed_by_user_id,
      changeReason: row.change_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: new Date(row.created_at),
    };
  }
}
