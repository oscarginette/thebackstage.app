/**
 * PostgresDownloadGateRepository
 *
 * PostgreSQL implementation of IDownloadGateRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Multi-tenant: ALL queries filter by user_id to ensure data isolation.
 * Clean Architecture: Infrastructure layer implementation.
 */

import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';
import { IDownloadGateRepository } from '@/domain/repositories/IDownloadGateRepository';
import { DownloadGate } from '@/domain/entities/DownloadGate';
import { PixelConfig } from '@/domain/entities/PixelConfig';
import { CreateGateInput } from '@/domain/types/download-gates';

export class PostgresDownloadGateRepository implements IDownloadGateRepository {
  async create(userId: number, input: CreateGateInput): Promise<DownloadGate> {
    try {
      const id = randomUUID();

      // Convert empty strings to null for optional fields
      const expiresAt = input.expiresAt && input.expiresAt instanceof Date
        ? input.expiresAt
        : null;

      const result = await sql`
        INSERT INTO download_gates (
          id,
          user_id,
          slug,
          title,
          artist_name,
          genre,
          description,
          artwork_url,
          soundcloud_track_id,
          soundcloud_track_url,
          soundcloud_user_id,
          file_url,
          file_size_mb,
          file_type,
          require_email,
          require_soundcloud_repost,
          require_soundcloud_follow,
          require_spotify_connect,
          require_instagram_follow,
          instagram_profile_url,
          enable_soundcloud_buy_link,
          active,
          max_downloads,
          expires_at,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${userId},
          ${input.slug},
          ${input.title},
          ${input.artistName || null},
          ${input.genre || null},
          ${input.description || null},
          ${input.artworkUrl || null},
          ${input.soundcloudTrackId || null},
          ${input.soundcloudTrackUrl || null},
          ${input.soundcloudUserId || null},
          ${input.fileUrl},
          ${input.fileSizeMb ?? null},
          ${input.fileType || null},
          ${input.requireEmail ?? true},
          ${input.requireSoundcloudRepost ?? false},
          ${input.requireSoundcloudFollow ?? false},
          ${input.requireSpotifyConnect ?? false},
          ${input.requireInstagramFollow ?? false},
          ${input.instagramProfileUrl || null},
          ${input.enableSoundcloudBuyLink ?? false},
          ${input.active ?? true},
          ${input.maxDownloads ?? null},
          ${expiresAt},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create download gate');
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error('PostgresDownloadGateRepository.create error:', error);

      // Handle duplicate slug constraint
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error(`Slug "${input.slug}" is already taken`);
      }

      throw new Error(`Failed to create download gate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(userId: number, gateId: string): Promise<DownloadGate | null> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE id = ${gateId} AND user_id = ${userId}
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.findById error:', error);
      throw new Error(`Failed to find download gate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAllByUser(userId: number): Promise<DownloadGate[]> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return result.rows.map((row: any) => this.mapToEntity(row));
    } catch (error) {
      console.error('PostgresDownloadGateRepository.findAllByUser error:', error);
      throw new Error(`Failed to find download gates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(userId: number, gateId: string, input: Partial<CreateGateInput>): Promise<DownloadGate> {
    try {
      // Get current gate first
      const existing = await this.findById(userId, gateId);
      if (!existing) {
        throw new Error('Download gate not found');
      }

      // Use COALESCE to update only provided fields
      // Vercel Postgres template literal syntax
      const result = await sql`
        UPDATE download_gates
        SET
          slug = COALESCE(${input.slug}, slug),
          title = COALESCE(${input.title}, title),
          artist_name = COALESCE(${input.artistName}, artist_name),
          genre = COALESCE(${input.genre}, genre),
          description = COALESCE(${input.description}, description),
          artwork_url = COALESCE(${input.artworkUrl}, artwork_url),
          soundcloud_track_id = COALESCE(${input.soundcloudTrackId}, soundcloud_track_id),
          soundcloud_track_url = COALESCE(${input.soundcloudTrackUrl}, soundcloud_track_url),
          soundcloud_user_id = COALESCE(${input.soundcloudUserId}, soundcloud_user_id),
          file_url = COALESCE(${input.fileUrl}, file_url),
          file_size_mb = COALESCE(${input.fileSizeMb}, file_size_mb),
          file_type = COALESCE(${input.fileType}, file_type),
          require_email = COALESCE(${input.requireEmail}, require_email),
          require_soundcloud_repost = COALESCE(${input.requireSoundcloudRepost}, require_soundcloud_repost),
          require_soundcloud_follow = COALESCE(${input.requireSoundcloudFollow}, require_soundcloud_follow),
          require_spotify_connect = COALESCE(${input.requireSpotifyConnect}, require_spotify_connect),
          require_instagram_follow = COALESCE(${input.requireInstagramFollow}, require_instagram_follow),
          instagram_profile_url = COALESCE(${input.instagramProfileUrl}, instagram_profile_url),
          enable_soundcloud_buy_link = COALESCE(${input.enableSoundcloudBuyLink}, enable_soundcloud_buy_link),
          active = COALESCE(${input.active}, active),
          max_downloads = COALESCE(${input.maxDownloads}, max_downloads),
          expires_at = COALESCE(${input.expiresAt}, expires_at),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${gateId} AND user_id = ${userId}
        RETURNING *
      `;

      if (result.rowCount === 0 || result.rows.length === 0) {
        throw new Error('Download gate not found');
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error('PostgresDownloadGateRepository.update error:', error);

      // Handle duplicate slug constraint
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error(`Slug "${input.slug}" is already taken`);
      }

      throw new Error(`Failed to update download gate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(userId: number, gateId: string): Promise<void> {
    try {
      const result = await sql`
        DELETE FROM download_gates
        WHERE id = ${gateId} AND user_id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Download gate not found');
      }
    } catch (error) {
      console.error('PostgresDownloadGateRepository.delete error:', error);
      throw new Error(`Failed to delete download gate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findBySlug(slug: string): Promise<DownloadGate | null> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE slug = ${slug}
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.findBySlug error:', error);
      throw new Error(`Failed to find download gate by slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async incrementDownloadCount(gateId: string): Promise<void> {
    try {
      // Update timestamp to track activity
      await sql`
        UPDATE download_gates
        SET updated_at = NOW()
        WHERE id = ${gateId}
      `;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.incrementDownloadCount error:', error);
      throw new Error(`Failed to increment download count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDownloadCount(gateId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM download_submissions
        WHERE gate_id = ${gateId} AND download_completed = true
      `;

      if (result.rows.length === 0) return 0;

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('PostgresDownloadGateRepository.getDownloadCount error:', error);
      throw new Error(`Failed to get download count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async incrementViewCount(gateId: string): Promise<void> {
    try {
      // Update timestamp to track activity (actual view tracking via analytics)
      await sql`
        UPDATE download_gates
        SET updated_at = NOW()
        WHERE id = ${gateId}
      `;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.incrementViewCount error:', error);
      throw new Error(`Failed to increment view count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isSlugAvailable(slug: string, excludeGateId?: string): Promise<boolean> {
    try {
      let result;

      if (excludeGateId) {
        result = await sql`
          SELECT id FROM download_gates
          WHERE slug = ${slug} AND id != ${excludeGateId}
          LIMIT 1
        `;
      } else {
        result = await sql`
          SELECT id FROM download_gates
          WHERE slug = ${slug}
          LIMIT 1
        `;
      }

      return result.rows.length === 0;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.isSlugAvailable error:', error);
      throw new Error(`Failed to check slug availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find gate by ID without userId validation
   * Used for public operations (submissions, OAuth callbacks, click tracking)
   * @param gateId - Gate UUID
   * @returns Gate or null if not found
   */
  async findByIdPublic(gateId: string): Promise<DownloadGate | null> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE id = ${gateId}
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadGateRepository.findByIdPublic error:', error);
      return null;
    }
  }

  /**
   * Map database row to DownloadGate entity
   * Converts snake_case to camelCase and handles null values
   */
  private mapToEntity(row: any): DownloadGate {
    return DownloadGate.fromDatabase({
      id: row.id,
      userId: row.user_id,
      slug: row.slug,
      title: row.title,
      artistName: row.artist_name ?? null,
      genre: row.genre ?? null,
      description: row.description ?? null,
      artworkUrl: row.artwork_url ?? null,
      soundcloudTrackId: row.soundcloud_track_id ?? null,
      soundcloudTrackUrl: row.soundcloud_track_url ?? null,
      soundcloudUserId: row.soundcloud_user_id ?? null,
      fileUrl: row.file_url,
      fileSizeMb: row.file_size_mb ?? null,
      fileType: row.file_type ?? null,
      requireEmail: row.require_email,
      requireSoundcloudRepost: row.require_soundcloud_repost,
      requireSoundcloudFollow: row.require_soundcloud_follow,
      requireSpotifyConnect: row.require_spotify_connect,
      requireInstagramFollow: row.require_instagram_follow ?? false,
      instagramProfileUrl: row.instagram_profile_url ?? null,
      enableSoundcloudBuyLink: row.enable_soundcloud_buy_link ?? false,
      active: row.active,
      maxDownloads: row.max_downloads ?? null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      pixelConfig: row.pixel_config ? PixelConfig.fromDatabase(row.pixel_config) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
