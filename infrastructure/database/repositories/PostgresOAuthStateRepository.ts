/**
 * PostgresOAuthStateRepository
 *
 * PostgreSQL implementation of IOAuthStateRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Handles OAuth state token generation, validation, and cleanup.
 * Security: State tokens are crypto-secure, single-use, and time-limited.
 * Clean Architecture: Infrastructure layer implementation.
 */

import { sql } from '@/lib/db';
import { IOAuthStateRepository } from '@/domain/repositories/IOAuthStateRepository';
import { OAuthState, CreateOAuthStateInput } from '@/domain/types/download-gates';

export class PostgresOAuthStateRepository implements IOAuthStateRepository {
  async create(input: CreateOAuthStateInput): Promise<OAuthState> {
    try {
      const result = await sql`
        INSERT INTO oauth_states (
          state_token,
          provider,
          submission_id,
          gate_id,
          code_verifier,
          used,
          expires_at
        ) VALUES (
          ${input.stateToken},
          ${input.provider},
          ${input.submissionId},
          ${input.gateId},
          ${input.codeVerifier ?? null},
          false,
          ${input.expiresAt.toISOString()}
        )
        RETURNING *
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create OAuth state');
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error('PostgresOAuthStateRepository.create error:', error);
      throw new Error(`Failed to create OAuth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByStateToken(token: string): Promise<OAuthState | null> {
    try {
      const result = await sql`
        SELECT * FROM oauth_states
        WHERE state_token = ${token}
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresOAuthStateRepository.findByStateToken error:', error);
      throw new Error(`Failed to find OAuth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markAsUsed(id: string): Promise<void> {
    try {
      const result = await sql`
        UPDATE oauth_states
        SET used = true
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('OAuth state not found');
      }
    } catch (error) {
      console.error('PostgresOAuthStateRepository.markAsUsed error:', error);
      throw new Error(`Failed to mark OAuth state as used: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await sql`
        DELETE FROM oauth_states
        WHERE expires_at < NOW()
        RETURNING id
      `;

      return result.rowCount || 0;
    } catch (error) {
      console.error('PostgresOAuthStateRepository.deleteExpired error:', error);
      throw new Error(`Failed to delete expired OAuth states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isValid(token: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT id FROM oauth_states
        WHERE state_token = ${token}
          AND used = false
          AND expires_at > NOW()
        LIMIT 1
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('PostgresOAuthStateRepository.isValid error:', error);
      throw new Error(`Failed to validate OAuth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to OAuthState entity
   * Converts snake_case to camelCase and handles date conversions
   */
  private mapToEntity(row: any): OAuthState {
    return {
      id: row.id,
      stateToken: row.state_token,
      provider: row.provider,
      submissionId: row.submission_id,
      gateId: row.gate_id,
      codeVerifier: row.code_verifier,
      used: row.used,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }
}
