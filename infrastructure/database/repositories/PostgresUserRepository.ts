/**
 * PostgresUserRepository
 *
 * PostgreSQL implementation of IUserRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { IUserRepository, CreateUserData } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { UpdateSubscriptionInput } from '@/domain/types/subscriptions';

export class PostgresUserRepository implements IUserRepository {
  /**
   * Create new user
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO users (
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        )
        VALUES (
          ${data.email.toLowerCase().trim()},
          ${data.passwordHash},
          'artist',
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at,
          name,
          subscription_plan,
          max_monthly_emails,
          emails_sent_this_month,
          quota_reset_at,
          subscription_started_at,
          subscription_expires_at
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at),
        row.subscription_plan,
        row.max_monthly_emails,
        row.emails_sent_this_month,
        new Date(row.quota_reset_at),
        row.name,
        row.subscription_started_at ? new Date(row.subscription_started_at) : undefined,
        row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined
      );
    } catch (error) {
      console.error('PostgresUserRepository.create error:', error);

      // Check for unique constraint violation (duplicate email)
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Email already exists');
      }

      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          name,
          role,
          active,
          created_at,
          updated_at,
          subscription_plan,
          subscription_started_at,
          subscription_expires_at,
          monthly_quota,
          emails_sent_this_month,
          quota_reset_at
        FROM users
        WHERE LOWER(email) = LOWER(${email.trim()})
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at),
        row.subscription_plan ?? 'free',
        row.monthly_quota ?? 1000,
        row.emails_sent_this_month ?? 0,
        row.quota_reset_at ? new Date(row.quota_reset_at) : new Date(),
        row.name,
        row.subscription_started_at ? new Date(row.subscription_started_at) : undefined,
        row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined
      );
    } catch (error) {
      console.error('PostgresUserRepository.findByEmail error:', error);
      throw new Error(
        `Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          name,
          role,
          active,
          created_at,
          updated_at,
          subscription_plan,
          subscription_started_at,
          subscription_expires_at,
          monthly_quota,
          emails_sent_this_month,
          quota_reset_at
        FROM users
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at),
        row.subscription_plan ?? 'free',
        row.monthly_quota ?? 1000,
        row.emails_sent_this_month ?? 0,
        row.quota_reset_at ? new Date(row.quota_reset_at) : new Date(),
        row.name,
        row.subscription_started_at ? new Date(row.subscription_started_at) : undefined,
        row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined
      );
    } catch (error) {
      console.error('PostgresUserRepository.findById error:', error);
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user's last session timestamp
   * Called by NextAuth on successful login
   */
  async updateLastSession(userId: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateLastSession error:', error);
      throw new Error(
        `Failed to update last session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if email already exists (case-insensitive)
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(
          SELECT 1
          FROM users
          WHERE LOWER(email) = LOWER(${email.trim()})
        ) as exists
      `;

      if (result.rows.length === 0) return false;

      return result.rows[0].exists;
    } catch (error) {
      console.error('PostgresUserRepository.emailExists error:', error);
      throw new Error(
        `Failed to check email existence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all users (admin only)
   */
  async findAll(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          name,
          role,
          active,
          created_at,
          updated_at,
          subscription_plan,
          subscription_started_at,
          subscription_expires_at,
          monthly_quota,
          emails_sent_this_month,
          quota_reset_at
        FROM users
        ORDER BY created_at DESC
      `;

      return result.rows.map((row: any) =>
        User.fromDatabase(
          row.id,
          row.email,
          row.password_hash,
          row.role,
          row.active,
          new Date(row.created_at),
          new Date(row.updated_at),
          row.subscription_plan ?? 'free',
          row.monthly_quota ?? 1000,
          row.emails_sent_this_month ?? 0,
          row.quota_reset_at ? new Date(row.quota_reset_at) : new Date(),
          row.name,
          row.subscription_started_at ? new Date(row.subscription_started_at) : undefined,
          row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined
        )
      );
    } catch (error) {
      console.error('PostgresUserRepository.findAll error:', error);
      throw new Error(
        `Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Toggle user active status (admin only)
   */
  async updateActiveStatus(userId: number, active: boolean): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          active = ${active},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateActiveStatus error:', error);
      throw new Error(
        `Failed to update active status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user subscription plan and quota limits
   * Used when activating or changing subscription plans
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async updateSubscription(userId: number, input: UpdateSubscriptionInput): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          subscription_plan = ${input.subscriptionPlan},
          subscription_started_at = ${input.subscriptionStartedAt},
          subscription_expires_at = ${input.subscriptionExpiresAt ?? null},
          max_contacts = ${input.maxContacts},
          max_monthly_emails = ${input.maxMonthlyEmails},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateSubscription error:', error);
      throw new Error(
        `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Increment emails sent counter for current billing period
   * Used to track quota usage and prevent over-sending
   * SECURITY: Uses parameterized queries and atomic increment operation
   */
  async incrementEmailsSent(userId: number, count: number): Promise<void> {
    try {
      // Validate count is positive
      if (count < 0) {
        throw new Error('Count must be positive');
      }

      const result = await sql`
        UPDATE users
        SET
          emails_sent_this_month = emails_sent_this_month + ${count},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.incrementEmailsSent error:', error);
      throw new Error(
        `Failed to increment emails sent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user quota information (subscription limits and current usage)
   * Used by quota check use cases to determine if user can perform actions
   */
  async getQuotaInfo(userId: number): Promise<{
    maxContacts: number;
    maxMonthlyEmails: number;
    emailsSentThisMonth: number;
    subscriptionPlan: string;
    subscriptionExpiresAt: Date | null;
  }> {
    try {
      const result = await sql`
        SELECT
          max_contacts,
          max_monthly_emails,
          emails_sent_this_month,
          subscription_plan,
          subscription_expires_at
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      const row = result.rows[0];

      return {
        maxContacts: row.max_contacts ?? 100, // Default to free tier
        maxMonthlyEmails: row.max_monthly_emails ?? 500, // Default to free tier
        emailsSentThisMonth: row.emails_sent_this_month ?? 0,
        subscriptionPlan: row.subscription_plan ?? 'free',
        subscriptionExpiresAt: row.subscription_expires_at
          ? new Date(row.subscription_expires_at)
          : null,
      };
    } catch (error) {
      console.error('PostgresUserRepository.getQuotaInfo error:', error);
      throw new Error(
        `Failed to get quota info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
