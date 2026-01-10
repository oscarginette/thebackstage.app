/**
 * PostgresSavedReleasesRepository
 *
 * PostgreSQL implementation of ISavedReleasesRepository.
 * Handles saved releases data access.
 */

import { sql } from '@vercel/postgres';
import { SavedRelease } from '@/domain/entities/SavedRelease';
import {
  ISavedReleasesRepository,
  CreateSavedReleaseInput,
} from '@/domain/repositories/ISavedReleasesRepository';

export class PostgresSavedReleasesRepository implements ISavedReleasesRepository {
  /**
   * Record a newly saved release
   */
  async create(input: CreateSavedReleaseInput): Promise<void> {
    try {
      // Convert track IDs array to PostgreSQL array - use JSON for safe insertion
      const trackIds = input.spotifyTrackIds || [];
      const trackIdsJson = JSON.stringify(trackIds);

      await sql`
        INSERT INTO spotify_saved_releases (
          subscription_id,
          release_type,
          spotify_album_id,
          spotify_track_ids,
          album_name,
          release_date,
          save_status,
          error_message
        )
        VALUES (
          ${input.subscriptionId}::uuid,
          ${input.releaseType},
          ${input.spotifyAlbumId},
          ${trackIdsJson}::jsonb::text[],
          ${input.albumName},
          ${input.releaseDate.toISOString()},
          ${input.saveStatus || 'success'},
          ${input.errorMessage || null}
        )
        ON CONFLICT (subscription_id, spotify_album_id) DO NOTHING
      `;
    } catch (error) {
      console.error('PostgresSavedReleasesRepository.create error:', error);
      throw new Error(
        `Failed to create saved release: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all saved album IDs for a subscription
   */
  async getSavedAlbumIds(subscriptionId: string): Promise<string[]> {
    try {
      const result = await sql`
        SELECT spotify_album_id
        FROM spotify_saved_releases
        WHERE subscription_id = ${subscriptionId}::uuid
      `;

      return result.rows.map((row) => row.spotify_album_id);
    } catch (error) {
      console.error('PostgresSavedReleasesRepository.getSavedAlbumIds error:', error);
      throw new Error(
        `Failed to get saved album IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find all saved releases for a subscription
   */
  async findBySubscription(subscriptionId: string): Promise<SavedRelease[]> {
    try {
      const result = await sql`
        SELECT *
        FROM spotify_saved_releases
        WHERE subscription_id = ${subscriptionId}::uuid
        ORDER BY release_date DESC
      `;

      return result.rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      console.error('PostgresSavedReleasesRepository.findBySubscription error:', error);
      throw new Error(
        `Failed to find saved releases: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a specific album is already saved
   */
  async isAlreadySaved(subscriptionId: string, albumId: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT id
        FROM spotify_saved_releases
        WHERE subscription_id = ${subscriptionId}::uuid
          AND spotify_album_id = ${albumId}
        LIMIT 1
      `;

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('PostgresSavedReleasesRepository.isAlreadySaved error:', error);
      throw new Error(
        `Failed to check if album is saved: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map database row to entity
   */
  private mapToEntity(row: any): SavedRelease {
    return SavedRelease.fromDatabase({
      id: row.id,
      subscriptionId: row.subscription_id,
      releaseType: row.release_type,
      spotifyAlbumId: row.spotify_album_id,
      spotifyTrackIds: row.spotify_track_ids || [],
      albumName: row.album_name,
      releaseDate: new Date(row.release_date),
      savedAt: new Date(row.saved_at),
      saveStatus: row.save_status || 'success',
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
    });
  }
}
