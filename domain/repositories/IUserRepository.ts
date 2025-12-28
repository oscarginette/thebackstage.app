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
}
