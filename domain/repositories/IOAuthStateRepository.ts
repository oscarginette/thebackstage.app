/**
 * IOAuthStateRepository Interface
 *
 * Defines the contract for OAuth state management.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation (PostgreSQL)
 *
 * OAuth state tokens are used for CSRF protection during
 * SoundCloud and Spotify OAuth flows. They link the OAuth
 * callback back to the original download submission.
 *
 * Security: State tokens must be:
 * - Random (crypto-secure)
 * - Single-use (marked as used after callback)
 * - Time-limited (expired tokens are rejected)
 */

import { OAuthState, CreateOAuthStateInput } from '../types/download-gates';

/**
 * Repository interface for OAuthState
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IOAuthStateRepository {
  /**
   * Create a new OAuth state token
   * Used before redirecting user to OAuth provider
   * @param input - OAuth state creation data
   * @returns Created OAuth state with generated token
   */
  create(input: CreateOAuthStateInput): Promise<OAuthState>;

  /**
   * Find OAuth state by state token
   * Used when OAuth provider redirects back with state parameter
   * @param token - State token from OAuth callback
   * @returns OAuth state or null if not found
   */
  findByStateToken(token: string): Promise<OAuthState | null>;

  /**
   * Mark OAuth state as used
   * Used after successful OAuth callback processing
   * Prevents replay attacks (state token can only be used once)
   * @param id - OAuth state ID (UUID)
   */
  markAsUsed(id: string): Promise<void>;

  /**
   * Delete expired OAuth states
   * Cleanup job to remove old state tokens
   * Should be run periodically (e.g., daily cron job)
   * @returns Number of deleted states
   */
  deleteExpired(): Promise<number>;

  /**
   * Validate OAuth state
   * Checks if state is valid: exists, not used, not expired
   * @param token - State token to validate
   * @returns True if state is valid and ready to use
   */
  isValid(token: string): Promise<boolean>;
}
