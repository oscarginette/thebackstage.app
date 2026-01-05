/**
 * User Entity
 *
 * Represents a user in the multi-tenant email system.
 * Handles password hashing with bcrypt for secure authentication.
 *
 * Clean Architecture: Domain entity with no external dependencies.
 * SOLID: Single Responsibility - User data and validation only.
 */

import bcrypt from 'bcrypt';
import { UserRole, USER_ROLES } from '../types/user-roles';

// Re-export for backward compatibility
export type { UserRole };
export { USER_ROLES };

export interface UserProps {
  id: number;
  email: string;
  passwordHash: string;
  name?: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Subscription & Quota
  subscriptionPlan: string;
  subscriptionStartedAt?: Date;
  subscriptionExpiresAt?: Date;
  maxMonthlyEmails: number;
  emailsSentThisMonth: number;
  quotaResetAt: Date;

  // Platform Integrations
  spotifyId?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export class User {
  private constructor(private readonly props: UserProps) {
    this.validate();
  }

  private validate(): void {
    // Email validation
    if (!this.props.email || typeof this.props.email !== 'string') {
      throw new Error('Invalid email: must be a non-empty string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.props.email)) {
      throw new Error('Invalid email: must be valid email format');
    }

    // Password hash validation (bcrypt hashes are 60 chars)
    if (!this.props.passwordHash || this.props.passwordHash.length < 59) {
      throw new Error('Invalid passwordHash: must be valid bcrypt hash');
    }
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get subscriptionPlan(): string {
    return this.props.subscriptionPlan;
  }

  get subscriptionStartedAt(): Date | undefined {
    return this.props.subscriptionStartedAt;
  }

  get subscriptionExpiresAt(): Date | undefined {
    return this.props.subscriptionExpiresAt;
  }

  get maxMonthlyEmails(): number {
    return this.props.maxMonthlyEmails;
  }

  get emailsSentThisMonth(): number {
    return this.props.emailsSentThisMonth;
  }

  get quotaResetAt(): Date {
    return this.props.quotaResetAt;
  }

  get spotifyId(): string | undefined {
    return this.props.spotifyId;
  }

  isAdmin(): boolean {
    return this.props.role === USER_ROLES.ADMIN;
  }

  // Business logic methods

  /**
   * Verify password against stored hash
   * @param password - Plain text password to verify
   * @returns Promise<boolean> - True if password matches
   */
  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.props.passwordHash);
  }

  /**
   * Return user data without sensitive information
   * SECURITY: Never expose password hash in API responses
   */
  toPublic(): { id: number; email: string; name?: string; role: UserRole; active: boolean; createdAt: Date } {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      role: this.props.role,
      active: this.props.active,
      createdAt: this.props.createdAt,
    };
  }

  // Static factory methods

  /**
   * Create User entity from database row
   * Used by repositories when fetching from database
   */
  static fromDatabase(
    id: number,
    email: string,
    passwordHash: string,
    role: UserRole,
    active: boolean,
    createdAt: Date,
    updatedAt: Date,
    subscriptionPlan: string,
    maxMonthlyEmails: number,
    emailsSentThisMonth: number,
    quotaResetAt: Date,
    name?: string,
    subscriptionStartedAt?: Date,
    subscriptionExpiresAt?: Date
  ): User {
    return new User({
      id,
      email,
      passwordHash,
      name,
      role,
      active,
      createdAt,
      updatedAt,
      subscriptionPlan,
      subscriptionStartedAt,
      subscriptionExpiresAt,
      maxMonthlyEmails,
      emailsSentThisMonth,
      quotaResetAt,
    });
  }

  /**
   * Create new User entity with hashed password
   * Used when registering new users
   * @param email - User email
   * @param password - Plain text password (will be hashed)
   * @param role - User role (default: 'artist')
   * @returns Promise<User> - User entity with hashed password
   */
  static async createNew(email: string, password: string, role: UserRole = USER_ROLES.ARTIST): Promise<User> {
    // Validate password strength
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return new User({
      id: 0, // Will be set by database
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
      subscriptionPlan: 'free',
      maxMonthlyEmails: 1000,
      emailsSentThisMonth: 0,
      quotaResetAt: nextMonth,
    });
  }

  /**
   * Validate password strength
   * Used by use cases before creating user
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password && password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (password && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (password && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (password && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   * Used by use cases before creating user
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 255) {
      return { valid: false, error: 'Email must not exceed 255 characters' };
    }

    return { valid: true };
  }
}
