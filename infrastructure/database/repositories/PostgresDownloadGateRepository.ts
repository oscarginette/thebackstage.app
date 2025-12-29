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
import { db } from '@vercel/postgres';
import { randomUUID } from 'crypto';
import { IDownloadGateRepository } from '@/domain/repositories/IDownloadGateRepository';
import { DownloadGate } from '@/domain/entities/DownloadGate';
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
      // Build dynamic UPDATE query
      const updates: string[] = [];
      const values: any[] = [];

      if (input.slug !== undefined) {
        updates.push('slug = $' + (values.length + 1));
        values.push(input.slug);
      }
      if (input.title !== undefined) {
        updates.push('title = $' + (values.length + 1));
        values.push(input.title);
      }
      if (input.artistName !== undefined) {
        updates.push('artist_name = $' + (values.length + 1));
        values.push(input.artistName);
      }
      if (input.genre !== undefined) {
        updates.push('genre = $' + (values.length + 1));
        values.push(input.genre);
      }
      if (input.description !== undefined) {
        updates.push('description = $' + (values.length + 1));
        values.push(input.description);
      }
      if (input.artworkUrl !== undefined) {
        updates.push('artwork_url = $' + (values.length + 1));
        values.push(input.artworkUrl);
      }
      if (input.soundcloudTrackId !== undefined) {
        updates.push('soundcloud_track_id = $' + (values.length + 1));
        values.push(input.soundcloudTrackId);
      }
      if (input.soundcloudTrackUrl !== undefined) {
        updates.push('soundcloud_track_url = $' + (values.length + 1));
        values.push(input.soundcloudTrackUrl);
      }
      if (input.soundcloudUserId !== undefined) {
        updates.push('soundcloud_user_id = $' + (values.length + 1));
        values.push(input.soundcloudUserId);
      }
      if (input.fileUrl !== undefined) {
        updates.push('file_url = $' + (values.length + 1));
        values.push(input.fileUrl);
      }
      if (input.fileSizeMb !== undefined) {
        updates.push('file_size_mb = $' + (values.length + 1));
        values.push(input.fileSizeMb);
      }
      if (input.fileType !== undefined) {
        updates.push('file_type = $' + (values.length + 1));
        values.push(input.fileType);
      }
      if (input.requireEmail !== undefined) {
        updates.push('require_email = $' + (values.length + 1));
        values.push(input.requireEmail);
      }
      if (input.requireSoundcloudRepost !== undefined) {
        updates.push('require_soundcloud_repost = $' + (values.length + 1));
        values.push(input.requireSoundcloudRepost);
      }
      if (input.requireSoundcloudFollow !== undefined) {
        updates.push('require_soundcloud_follow = $' + (values.length + 1));
        values.push(input.requireSoundcloudFollow);
      }
      if (input.requireSpotifyConnect !== undefined) {
        updates.push('require_spotify_connect = $' + (values.length + 1));
        values.push(input.requireSpotifyConnect);
      }
      if (input.active !== undefined) {
        updates.push('active = $' + (values.length + 1));
        values.push(input.active);
      }
      if (input.maxDownloads !== undefined) {
        updates.push('max_downloads = $' + (values.length + 1));
        values.push(input.maxDownloads);
      }
      if (input.expiresAt !== undefined) {
        updates.push('expires_at = $' + (values.length + 1));
        values.push(input.expiresAt);
      }

      // Always update updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      if (updates.length === 1) {
        // Only updated_at is being updated, return existing
        const existing = await this.findById(userId, gateId);
        if (!existing) {
          throw new Error('Download gate not found');
        }
        return existing;
      }

      // Add WHERE clause values
      values.push(gateId, userId);

      const client = await db.connect();
      try {
        const result = await client.query(
          `UPDATE download_gates
           SET ${updates.join(', ')}
           WHERE id = $${values.length - 1} AND user_id = $${values.length}
           RETURNING *`,
          values
        );

        if (result.rowCount === 0 || result.rows.length === 0) {
          throw new Error('Download gate not found');
        }

        return this.mapToEntity(result.rows[0]);
      } finally {
        client.release();
      }
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
      active: row.active,
      maxDownloads: row.max_downloads ?? null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
