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
import { UserRole } from '@/domain/types/user-roles';

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
          quota_reset_at,
          spotify_id,
          soundcloud_id,
          sender_email,
          sender_name
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
        row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
        row.spotify_id,
        row.soundcloud_id,
        row.sender_email,
        row.sender_name
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
          quota_reset_at,
          spotify_id,
          soundcloud_id,
          sender_email,
          sender_name
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
        row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
        row.spotify_id,
        row.soundcloud_id,
        row.sender_email,
        row.sender_name
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

  /**
   * Update user's monthly email quota
   * Admin-only operation to adjust email sending limits
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async updateQuota(userId: number, monthlyQuota: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          monthly_quota = ${monthlyQuota},
          max_monthly_emails = ${monthlyQuota},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateQuota error:', error);
      throw new Error(
        `Failed to update quota: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user role (admin-only operation)
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async updateRole(email: string, role: UserRole): Promise<User> {
    try {
      const result = await sql`
        UPDATE users
        SET
          role = ${role},
          updated_at = NOW()
        WHERE LOWER(email) = LOWER(${email.trim()})
        RETURNING
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
      `;

      if (result.rows.length === 0) {
        throw new Error(`User not found with email: ${email}`);
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
      console.error('PostgresUserRepository.updateRole error:', error);
      throw new Error(
        `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find admin users by IDs
   * Used to prevent deletion of admin accounts
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async findAdminsByIds(ids: number[]): Promise<User[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

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
        WHERE id = ANY(${ids})
          AND role = 'admin'
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
      console.error('PostgresUserRepository.findAdminsByIds error:', error);
      throw new Error(
        `Failed to find admin users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete multiple users by IDs
   * Excludes admin users from deletion for safety
   * SECURITY: Uses parameterized queries to prevent SQL injection
   * SAFETY: Explicitly excludes admin users in WHERE clause as a safeguard
   */
  async deleteBulk(ids: number[]): Promise<number> {
    try {
      if (ids.length === 0) {
        return 0;
      }

      // Delete users, explicitly excluding admins for safety
      const result = await sql`
        DELETE FROM users
        WHERE id = ANY(${ids})
          AND role != 'admin'
        RETURNING id
      `;

      return result.rowCount ?? 0;
    } catch (error) {
      console.error('PostgresUserRepository.deleteBulk error:', error);
      throw new Error(
        `Failed to delete users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all active users with Spotify configured
   * Used by cron job to check for new releases across all users
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async findUsersWithSpotifyConfigured(): Promise<User[]> {
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
          quota_reset_at,
          spotify_id
        FROM users
        WHERE spotify_id IS NOT NULL
          AND spotify_id != ''
          AND active = true
        ORDER BY created_at ASC
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
          row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
          row.spotify_id ?? undefined,
          undefined // soundcloudId
        )
      );
    } catch (error) {
      console.error('PostgresUserRepository.findUsersWithSpotifyConfigured error:', error);
      throw new Error(
        `Failed to find users with Spotify: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all active users with SoundCloud configured
   * Used by cron job to check for new tracks across all users
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async findUsersWithSoundCloudConfigured(): Promise<User[]> {
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
          quota_reset_at,
          soundcloud_id
        FROM users
        WHERE soundcloud_id IS NOT NULL
          AND soundcloud_id != ''
          AND active = true
        ORDER BY created_at ASC
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
          row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined,
          undefined, // spotifyId
          row.soundcloud_id ?? undefined
        )
      );
    } catch (error) {
      console.error('PostgresUserRepository.findUsersWithSoundCloudConfigured error:', error);
      throw new Error(
        `Failed to find users with SoundCloud: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create password reset token for user
   * SECURITY: Generates crypto-secure token, 1-hour expiration, hashes before storage
   */
  async createPasswordResetToken(email: string): Promise<string | null> {
    try {
      const { PASSWORD_RESET_TOKEN_EXPIRY_MS } = await import('@/domain/types/password-reset');
      const { PasswordResetToken } = await import('@/domain/value-objects/PasswordResetToken');

      // Generate crypto-secure token and hash it
      const { plaintextToken, hashedToken } = PasswordResetToken.generate();

      // Calculate expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

      // Update user with HASHED token (case-insensitive email lookup)
      const result = await sql`
        UPDATE users
        SET
          reset_password_token = ${hashedToken},
          reset_password_token_expires_at = ${expiresAt},
          updated_at = NOW()
        WHERE LOWER(email) = LOWER(${email.trim()})
        RETURNING id
      `;

      // SECURITY: Don't reveal if email exists (return null silently)
      if (result.rowCount === 0) {
        return null;
      }

      // Return plaintext token to send via email
      return plaintextToken;
    } catch (error) {
      console.error('PostgresUserRepository.createPasswordResetToken error:', error);
      throw new Error(
        `Failed to create password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find user by password reset token
   * SECURITY: Hashes incoming token before comparison, returns null if token expired or invalid
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      const { PasswordResetToken } = await import('@/domain/value-objects/PasswordResetToken');

      // Hash the incoming token before querying database
      const hashedToken = PasswordResetToken.hash(token);

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
        WHERE reset_password_token = ${hashedToken}
          AND reset_password_token_expires_at > NOW()
          AND active = true
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
        row.subscription_started_at
          ? new Date(row.subscription_started_at)
          : undefined,
        row.subscription_expires_at
          ? new Date(row.subscription_expires_at)
          : undefined
      );
    } catch (error) {
      console.error(
        'PostgresUserRepository.findByPasswordResetToken error:',
        error
      );
      throw new Error(
        `Failed to find user by reset token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update password and invalidate reset token
   * SECURITY: Atomic operation, token is single-use
   */
  async updatePasswordAndInvalidateToken(
    userId: number,
    newPasswordHash: string
  ): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          password_hash = ${newPasswordHash},
          reset_password_token = NULL,
          reset_password_token_expires_at = NULL,
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error(
        'PostgresUserRepository.updatePasswordAndInvalidateToken error:',
        error
      );
      throw new Error(
        `Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Invalidate password reset token (cleanup)
   */
  async invalidatePasswordResetToken(userId: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          reset_password_token = NULL,
          reset_password_token_expires_at = NULL,
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error(
        'PostgresUserRepository.invalidatePasswordResetToken error:',
        error
      );
      throw new Error(
        `Failed to invalidate token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user's custom sender email configuration
   * Used to set custom "From" email for newsletters
   * IMPORTANT: Domain must be verified in sending_domains table for emails to send successfully
   */
  async updateSenderEmail(
    userId: number,
    senderEmail: string | null,
    senderName: string | null
  ): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          sender_email = ${senderEmail},
          sender_name = ${senderName},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      console.log('[PostgresUserRepository] Sender email updated:', {
        userId,
        senderEmail,
        senderName,
      });
    } catch (error) {
      console.error('PostgresUserRepository.updateSenderEmail error:', error);
      throw new Error(
        `Failed to update sender email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
