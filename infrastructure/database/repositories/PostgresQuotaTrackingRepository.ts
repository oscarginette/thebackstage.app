/**
 * PostgresQuotaTrackingRepository
 *
 * PostgreSQL implementation of IQuotaTrackingRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 */

import { sql } from '@/lib/db';
import { IQuotaTrackingRepository } from '@/domain/repositories/IQuotaTrackingRepository';
import { QuotaTracking } from '@/domain/entities/QuotaTracking';

export class PostgresQuotaTrackingRepository implements IQuotaTrackingRepository {
  async getByUserId(userId: number): Promise<QuotaTracking | null> {
    try {
      const result = await sql`
        SELECT
          id,
          user_id,
          emails_sent_today,
          last_reset_date,
          monthly_limit,
          created_at,
          updated_at
        FROM quota_tracking
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return QuotaTracking.create(
        row.id,
        row.user_id,
        row.emails_sent_today,
        new Date(row.last_reset_date),
        row.monthly_limit,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    } catch (error) {
      console.error('PostgresQuotaTrackingRepository.getByUserId error:', error);
      throw new Error(`Failed to get quota for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async incrementEmailCount(userId: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE quota_tracking
        SET
          emails_sent_today = emails_sent_today + 1,
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`Quota tracking not found for user ${userId}`);
      }
    } catch (error) {
      console.error('PostgresQuotaTrackingRepository.incrementEmailCount error:', error);
      throw new Error(`Failed to increment email count for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resetDailyCount(userId: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE quota_tracking
        SET
          emails_sent_today = 0,
          last_reset_date = NOW(),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`Quota tracking not found for user ${userId}`);
      }
    } catch (error) {
      console.error('PostgresQuotaTrackingRepository.resetDailyCount error:', error);
      throw new Error(`Failed to reset daily count for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMonthlyLimit(userId: number, newLimit: number): Promise<void> {
    // Validation
    if (newLimit <= 0 || newLimit > 10000) {
      throw new Error('Monthly limit must be between 1 and 10,000');
    }

    try {
      const result = await sql`
        UPDATE quota_tracking
        SET
          monthly_limit = ${newLimit},
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`Quota tracking not found for user ${userId}`);
      }
    } catch (error) {
      console.error('PostgresQuotaTrackingRepository.updateMonthlyLimit error:', error);
      throw new Error(`Failed to update monthly limit for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async create(userId: number, monthlyLimit: number): Promise<QuotaTracking> {
    // Validation
    if (monthlyLimit <= 0 || monthlyLimit > 10000) {
      throw new Error('Monthly limit must be between 1 and 10,000');
    }

    try {
      const result = await sql`
        INSERT INTO quota_tracking (
          user_id,
          emails_sent_today,
          last_reset_date,
          monthly_limit,
          created_at,
          updated_at
        )
        VALUES (
          ${userId},
          0,
          NOW(),
          ${monthlyLimit},
          NOW(),
          NOW()
        )
        RETURNING
          id,
          user_id,
          emails_sent_today,
          last_reset_date,
          monthly_limit,
          created_at,
          updated_at
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create quota tracking');
      }

      const row = result.rows[0];
      return QuotaTracking.create(
        row.id,
        row.user_id,
        row.emails_sent_today,
        new Date(row.last_reset_date),
        row.monthly_limit,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    } catch (error) {
      console.error('PostgresQuotaTrackingRepository.create error:', error);
      throw new Error(`Failed to create quota tracking for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
