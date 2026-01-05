/**
 * PostgresAutoSaveSubscriptionRepository
 *
 * PostgreSQL implementation of IAutoSaveSubscriptionRepository.
 * Handles auto-save subscription data access.
 */

import { sql } from '@vercel/postgres';
import { AutoSaveSubscription } from '@/domain/entities/AutoSaveSubscription';
import {
  IAutoSaveSubscriptionRepository,
  CreateSubscriptionInput,
  TokenUpdate,
} from '@/domain/repositories/IAutoSaveSubscriptionRepository';

export class PostgresAutoSaveSubscriptionRepository
  implements IAutoSaveSubscriptionRepository
{
  /**
   * Create a new subscription
   */
  async create(input: CreateSubscriptionInput): Promise<string> {
    try {
      const result = await sql`
        INSERT INTO spotify_auto_save_subscriptions (
          submission_id,
          spotify_user_id,
          artist_user_id,
          artist_spotify_id,
          access_token_encrypted,
          refresh_token_encrypted,
          token_expires_at,
          next_check_at
        )
        VALUES (
          ${input.submissionId}::uuid,
          ${input.spotifyUserId},
          ${input.artistUserId},
          ${input.artistSpotifyId},
          ${input.accessTokenEncrypted},
          ${input.refreshTokenEncrypted},
          ${input.tokenExpiresAt.toISOString()},
          ${input.nextCheckAt.toISOString()}
        )
        RETURNING id
      `;

      return result.rows[0].id;
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.create error:', error);
      throw new Error(
        `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string): Promise<AutoSaveSubscription | null> {
    try {
      const result = await sql`
        SELECT *
        FROM spotify_auto_save_subscriptions
        WHERE id = ${id}::uuid
      `;

      if (result.rowCount === 0) {
        return null;
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.findById error:', error);
      throw new Error(
        `Failed to find subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all active subscriptions due for checking
   */
  async findDueForCheck(): Promise<AutoSaveSubscription[]> {
    try {
      const result = await sql`
        SELECT *
        FROM spotify_auto_save_subscriptions
        WHERE active = true
          AND (next_check_at IS NULL OR next_check_at <= NOW())
        ORDER BY next_check_at ASC NULLS FIRST
        LIMIT 100
      `;

      return result.rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.findDueForCheck error:', error);
      throw new Error(
        `Failed to find subscriptions due for check: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update OAuth tokens
   */
  async updateTokens(id: string, tokens: TokenUpdate): Promise<void> {
    try {
      const result = await sql`
        UPDATE spotify_auto_save_subscriptions
        SET
          access_token_encrypted = ${tokens.accessTokenEncrypted},
          refresh_token_encrypted = ${tokens.refreshTokenEncrypted},
          token_expires_at = ${tokens.tokenExpiresAt},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Subscription not found');
      }
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.updateTokens error:', error);
      throw new Error(
        `Failed to update tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update last check timestamp
   */
  async updateLastCheck(id: string, timestamp: Date): Promise<void> {
    try {
      // Next check in 6 hours
      const nextCheck = new Date(timestamp.getTime() + 6 * 60 * 60 * 1000);

      const result = await sql`
        UPDATE spotify_auto_save_subscriptions
        SET
          last_check_at = ${timestamp},
          next_check_at = ${nextCheck},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Subscription not found');
      }
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.updateLastCheck error:', error);
      throw new Error(
        `Failed to update last check: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deactivate subscription
   */
  async deactivate(id: string): Promise<void> {
    try {
      const result = await sql`
        UPDATE spotify_auto_save_subscriptions
        SET
          active = false,
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Subscription not found');
      }
    } catch (error) {
      console.error('PostgresAutoSaveSubscriptionRepository.deactivate error:', error);
      throw new Error(
        `Failed to deactivate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find by Spotify user and artist
   */
  async findByUserAndArtist(
    spotifyUserId: string,
    artistSpotifyId: string
  ): Promise<AutoSaveSubscription | null> {
    try {
      const result = await sql`
        SELECT *
        FROM spotify_auto_save_subscriptions
        WHERE spotify_user_id = ${spotifyUserId}
          AND artist_spotify_id = ${artistSpotifyId}
        LIMIT 1
      `;

      if (result.rowCount === 0) {
        return null;
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error(
        'PostgresAutoSaveSubscriptionRepository.findByUserAndArtist error:',
        error
      );
      throw new Error(
        `Failed to find subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map database row to entity
   */
  private mapToEntity(row: any): AutoSaveSubscription {
    return AutoSaveSubscription.fromDatabase({
      id: row.id,
      submissionId: row.submission_id,
      spotifyUserId: row.spotify_user_id,
      artistUserId: row.artist_user_id,
      artistSpotifyId: row.artist_spotify_id,
      accessTokenEncrypted: row.access_token_encrypted,
      refreshTokenEncrypted: row.refresh_token_encrypted,
      tokenExpiresAt: new Date(row.token_expires_at),
      active: row.active ?? true,
      lastCheckAt: row.last_check_at ? new Date(row.last_check_at) : null,
      nextCheckAt: row.next_check_at ? new Date(row.next_check_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
