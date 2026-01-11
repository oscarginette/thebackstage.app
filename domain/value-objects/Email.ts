/**
 * Email Value Object
 *
 * Ensures email addresses are valid and normalized.
 * Implements Value Object pattern from DDD.
 *
 * SOLID Principles:
 * - SRP: Single responsibility (email validation and normalization)
 * - Immutability: Value objects are immutable
 *
 * Benefits:
 * - Centralizes email validation logic (DRY)
 * - Type-safe email handling
 * - Guaranteed valid state (invariant enforcement)
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly value: string;

  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  /**
   * Validate email format (static method for use in Use Cases)
   * @param email - Email to validate
   * @returns true if valid, false otherwise
   */
  static isValid(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    return Email.EMAIL_REGEX.test(email);
  }

  /**
   * Validate email format and throw error if invalid
   * @param email - Email to validate
   * @throws Error if email is invalid
   */
  static validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (!Email.EMAIL_REGEX.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  private validate(email: string): void {
    Email.validate(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
