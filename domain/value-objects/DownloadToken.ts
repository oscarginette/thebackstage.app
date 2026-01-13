/**
 * DownloadToken Value Object
 *
 * Immutable value object for download tokens.
 * Ensures tokens are cryptographically secure and properly formatted.
 *
 * SOLID Principles:
 * - SRP: Single responsibility (token generation and validation)
 * - Immutability: Value objects are immutable by design
 *
 * Security:
 * - Crypto-secure token generation using crypto.randomBytes
 * - 32-byte (64 hex char) tokens for strong security
 * - Expiry validation built-in
 *
 * Clean Architecture: Domain value object layer
 */

import { randomBytes } from 'crypto';
import { DOWNLOAD_TOKEN_CONFIG } from '../types/download-gate-constants';

export class DownloadToken {
  private readonly value: string;
  private readonly expiresAt: Date;

  private constructor(value: string, expiresAt: Date) {
    this.validate(value);
    this.value = value;
    this.expiresAt = expiresAt;
  }

  /**
   * Generate new secure download token
   * @returns DownloadToken instance
   */
  static generate(): DownloadToken {
    const token = randomBytes(DOWNLOAD_TOKEN_CONFIG.LENGTH_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_CONFIG.EXPIRY_MS);
    return new DownloadToken(token, expiresAt);
  }

  /**
   * Create from existing token and expiry
   * Used when loading from database
   * @param value - Token string
   * @param expiresAt - Expiration date
   * @returns DownloadToken instance
   */
  static fromExisting(value: string, expiresAt: Date): DownloadToken {
    return new DownloadToken(value, expiresAt);
  }

  /**
   * Validate token format
   * @param token - Token to validate
   * @throws Error if invalid
   */
  private validate(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new Error('Download token cannot be empty');
    }

    // Check hex format and length (64 chars = 32 bytes hex-encoded)
    const expectedLength = DOWNLOAD_TOKEN_CONFIG.LENGTH_BYTES * 2;
    if (token.length !== expectedLength) {
      throw new Error(
        `Download token must be ${expectedLength} characters (got ${token.length})`
      );
    }

    if (!/^[a-f0-9]+$/i.test(token)) {
      throw new Error('Download token must be hex-encoded');
    }
  }

  /**
   * Check if token is expired
   * @returns true if expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token is valid (not expired)
   * @returns true if valid
   */
  isValid(): boolean {
    return !this.isExpired();
  }

  /**
   * Get token value
   * @returns Token string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get expiration date
   * @returns Expiration Date
   */
  getExpiresAt(): Date {
    return this.expiresAt;
  }

  /**
   * Get time remaining until expiry in milliseconds
   * @returns Milliseconds until expiry (negative if expired)
   */
  getTimeRemaining(): number {
    return this.expiresAt.getTime() - Date.now();
  }

  /**
   * Compare with another DownloadToken
   * @param other - Other token
   * @returns true if equal
   */
  equals(other: DownloadToken): boolean {
    return (
      this.value === other.value &&
      this.expiresAt.getTime() === other.expiresAt.getTime()
    );
  }

  /**
   * String representation
   * @returns Token value
   */
  toString(): string {
    return this.value;
  }
}
