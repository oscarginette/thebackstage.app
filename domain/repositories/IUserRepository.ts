/**
 * IUserRepository Interface
 *
 * Repository contract for user operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 */

import { User } from '../entities/User';
import { UpdateSubscriptionInput } from '../types/subscriptions';
import { UserRole } from '../types/user-roles';

export interface CreateUserData {
  email: string;
  passwordHash: string;
}

export interface IUserRepository {
  /**
   * Create new user
   * @param data - User data with hashed password
   * @returns Created User entity
   * @throws Error if email already exists or creation fails
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Find user by email
   * @param email - User email (case-insensitive)
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   * @param id - User identifier
   * @returns User entity or null if not found
   */
  findById(id: number): Promise<User | null>;

  /**
   * Update user's last session timestamp
   * Used by NextAuth to track login activity
   * @param userId - User identifier
   * @throws Error if user not found or update fails
   */
  updateLastSession(userId: number): Promise<void>;

  /**
   * Check if email already exists
   * @param email - User email (case-insensitive)
   * @returns True if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Get all users (admin only)
   * @returns Array of all users
   */
  findAll(): Promise<User[]>;

  /**
   * Toggle user active status (admin only)
   * @param userId - User identifier
   * @param active - New active status
   * @throws Error if user not found or update fails
   */
  updateActiveStatus(userId: number, active: boolean): Promise<void>;

  /**
   * Update user subscription plan and quota limits
   * Used when activating or changing subscription plans
   * @param userId - User identifier
   * @param input - Subscription data (plan, limits, dates)
   * @throws Error if user not found or update fails
   */
  updateSubscription(userId: number, input: UpdateSubscriptionInput): Promise<void>;

  /**
   * Increment emails sent counter for current billing period
   * Used to track quota usage and prevent over-sending
   * @param userId - User identifier
   * @param count - Number of emails sent to add to counter
   * @throws Error if user not found or update fails
   */
  incrementEmailsSent(userId: number, count: number): Promise<void>;

  /**
   * Get user quota information (subscription limits and current usage)
   * @param userId - User identifier
   * @returns Quota information including limits and current counts
   * @throws Error if user not found
   */
  getQuotaInfo(userId: number): Promise<{
    maxContacts: number;
    maxMonthlyEmails: number;
    emailsSentThisMonth: number;
    subscriptionPlan: string;
    subscriptionExpiresAt: Date | null;
  }>;

  /**
   * Update user's monthly email quota
   * Admin-only operation to adjust email sending limits
   * @param userId - User identifier
   * @param monthlyQuota - New monthly email quota
   * @throws Error if user not found or update fails
   */
  updateQuota(userId: number, monthlyQuota: number): Promise<void>;

  /**
   * Update user role (admin-only operation)
   * @param email - User email (case-insensitive)
   * @param role - New role to assign
   * @returns Updated User entity
   * @throws Error if user not found or update fails
   */
  updateRole(email: string, role: UserRole): Promise<User>;

  /**
   * Find admin users by IDs
   * Used to prevent deletion of admin accounts
   * @param ids - Array of user IDs to check
   * @returns Array of admin users found in the ID list
   */
  findAdminsByIds(ids: number[]): Promise<User[]>;

  /**
   * Delete multiple users by IDs
   * Excludes admin users from deletion for safety
   * @param ids - Array of user IDs to delete
   * @returns Number of users deleted
   * @throws Error if deletion fails
   */
  deleteBulk(ids: number[]): Promise<number>;

  /**
   * Find all active users with Spotify configured
   * Used by cron job to check for new releases across all users
   * @returns Array of users with spotify_id and active status
   */
  findUsersWithSpotifyConfigured(): Promise<User[]>;

  /**
   * Find all active users with SoundCloud configured
   * Used by cron job to check for new tracks across all users
   * @returns Array of users with soundcloud_id and active status
   */
  findUsersWithSoundCloudConfigured(): Promise<User[]>;

  /**
   * Generate and save password reset token
   * SECURITY: Token is crypto-secure (32 bytes), hashed with SHA-256 before storage, expires in 1 hour
   * @param email - User email (case-insensitive)
   * @returns Plaintext reset token (64-char hex) to send via email, or null if user not found
   * @throws Error if database update fails
   * @note Only hashed token is stored in database - if DB is compromised, attackers cannot use tokens
   */
  createPasswordResetToken(email: string): Promise<string | null>;

  /**
   * Find user by password reset token
   * SECURITY: Hashes incoming token before DB comparison, returns null if token expired or invalid
   * @param token - Plaintext 64-char hex reset token (from email link)
   * @returns User entity or null if not found/expired
   * @note Token is hashed with SHA-256 before database lookup for security
   */
  findByPasswordResetToken(token: string): Promise<User | null>;

  /**
   * Update user password and invalidate reset token
   * SECURITY: Hashes password with bcrypt, clears token (single-use)
   * @param userId - User identifier
   * @param newPasswordHash - bcrypt hash of new password
   * @throws Error if user not found or update fails
   */
  updatePasswordAndInvalidateToken(
    userId: number,
    newPasswordHash: string
  ): Promise<void>;

  /**
   * Invalidate password reset token (without changing password)
   * Used when user requests new token or for cleanup
   * @param userId - User identifier
   * @throws Error if user not found or update fails
   */
  invalidatePasswordResetToken(userId: number): Promise<void>;
}
