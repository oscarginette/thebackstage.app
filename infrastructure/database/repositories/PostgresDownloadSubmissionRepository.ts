/**
 * PostgresDownloadSubmissionRepository
 *
 * PostgreSQL implementation of IDownloadSubmissionRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Handles download submissions, OAuth verifications, and download token generation.
 * Clean Architecture: Infrastructure layer implementation.
 */

import { sql } from '@/lib/db';
import { db } from '@vercel/postgres';
import { randomBytes } from 'crypto';
import { IDownloadSubmissionRepository } from '@/domain/repositories/IDownloadSubmissionRepository';
import { DownloadSubmission } from '@/domain/entities/DownloadSubmission';
import {
  CreateSubmissionInput,
  VerificationStatusUpdate,
  SoundCloudProfile,
  SpotifyProfile,
} from '@/domain/types/download-gates';

export class PostgresDownloadSubmissionRepository implements IDownloadSubmissionRepository {
  async create(input: CreateSubmissionInput): Promise<DownloadSubmission> {
    try {
      const result = await sql`
        INSERT INTO download_submissions (
          gate_id,
          email,
          first_name,
          ip_address,
          user_agent,
          consent_marketing,
          email_verified,
          soundcloud_repost_verified,
          soundcloud_follow_verified,
          spotify_connected,
          download_completed
        ) VALUES (
          ${input.gateId},
          ${input.email},
          ${input.firstName ?? null},
          ${input.ipAddress ?? null},
          ${input.userAgent ?? null},
          ${input.consentMarketing ?? false},
          false,
          false,
          false,
          false,
          false
        )
        RETURNING *
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create submission');
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.create error:', error);
      throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<DownloadSubmission | null> {
    try {
      const result = await sql`
        SELECT * FROM download_submissions
        WHERE id = ${id}::uuid
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.findById error:', error);
      throw new Error(`Failed to find submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByEmailAndGate(email: string, gateId: string): Promise<DownloadSubmission | null> {
    try {
      const result = await sql`
        SELECT * FROM download_submissions
        WHERE email = ${email} AND gate_id = ${gateId}::uuid
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.findByEmailAndGate error:', error);
      throw new Error(`Failed to find submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByToken(token: string): Promise<DownloadSubmission | null> {
    try {
      const result = await sql`
        SELECT * FROM download_submissions
        WHERE download_token = ${token}
        LIMIT 1
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.findByToken error:', error);
      throw new Error(`Failed to find submission by token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAllByGate(gateId: string): Promise<DownloadSubmission[]> {
    try {
      const result = await sql`
        SELECT * FROM download_submissions
        WHERE gate_id = ${gateId}::uuid
        ORDER BY created_at DESC
      `;

      return result.rows.map((row: any) => this.mapToEntity(row));
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.findAllByGate error:', error);
      throw new Error(`Failed to find submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateVerificationStatus(
    id: string,
    updates: VerificationStatusUpdate
  ): Promise<DownloadSubmission> {
    try {
      const setFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.emailVerified !== undefined) {
        setFields.push(`email_verified = $${paramIndex++}`);
        values.push(updates.emailVerified);
      }

      if (updates.soundcloudRepostVerified !== undefined) {
        setFields.push(`soundcloud_repost_verified = $${paramIndex++}`);
        values.push(updates.soundcloudRepostVerified);

        if (updates.soundcloudRepostVerified) {
          setFields.push(`soundcloud_repost_verified_at = $${paramIndex++}`);
          values.push(new Date());
        }
      }

      if (updates.soundcloudFollowVerified !== undefined) {
        setFields.push(`soundcloud_follow_verified = $${paramIndex++}`);
        values.push(updates.soundcloudFollowVerified);

        if (updates.soundcloudFollowVerified) {
          setFields.push(`soundcloud_follow_verified_at = $${paramIndex++}`);
          values.push(new Date());
        }
      }

      if (updates.spotifyConnected !== undefined) {
        setFields.push(`spotify_connected = $${paramIndex++}`);
        values.push(updates.spotifyConnected);

        if (updates.spotifyConnected) {
          setFields.push(`spotify_connected_at = $${paramIndex++}`);
          values.push(new Date());
        }
      }

      // Always update updated_at
      setFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      // Add WHERE clause id
      values.push(id);

      const client = await db.connect();
      try {
        const result = await client.query(
          `UPDATE download_submissions
           SET ${setFields.join(', ')}
           WHERE id = $${values.length}
           RETURNING *`,
          values
        );

        if (result.rowCount === 0 || result.rows.length === 0) {
          throw new Error('Submission not found');
        }

        return this.mapToEntity(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.updateVerificationStatus error:', error);
      throw new Error(`Failed to update verification status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDownloadToken(id: string, expiresAt: Date): Promise<string> {
    try {
      // Generate secure 32-byte token (64 hex characters)
      const token = randomBytes(32).toString('hex');

      const result = await sql`
        UPDATE download_submissions
        SET
          download_token = ${token},
          download_token_generated_at = NOW(),
          download_token_expires_at = ${expiresAt.toISOString()},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING download_token
      `;

      if (result.rowCount === 0 || result.rows.length === 0) {
        throw new Error('Submission not found');
      }

      return result.rows[0].download_token;
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.generateDownloadToken error:', error);
      throw new Error(`Failed to generate download token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markDownloadComplete(id: string): Promise<void> {
    try {
      const result = await sql`
        UPDATE download_submissions
        SET
          download_completed = true,
          download_completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Submission not found');
      }
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.markDownloadComplete error:', error);
      throw new Error(`Failed to mark download complete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSoundCloudProfile(id: string, profile: SoundCloudProfile): Promise<void> {
    try {
      const result = await sql`
        UPDATE download_submissions
        SET
          soundcloud_user_id = ${profile.userId},
          soundcloud_username = ${profile.username},
          soundcloud_permalink = ${profile.profileUrl ?? null},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Submission not found');
      }
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.updateSoundCloudProfile error:', error);
      throw new Error(`Failed to update SoundCloud profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSpotifyProfile(id: string, profile: SpotifyProfile): Promise<void> {
    try {
      const result = await sql`
        UPDATE download_submissions
        SET
          spotify_user_id = ${profile.userId},
          spotify_display_name = ${profile.displayName ?? null},
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error('Submission not found');
      }
    } catch (error) {
      console.error('PostgresDownloadSubmissionRepository.updateSpotifyProfile error:', error);
      throw new Error(`Failed to update Spotify profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to DownloadSubmission entity
   * Converts snake_case to camelCase and handles null values
   */
  private mapToEntity(row: any): DownloadSubmission {
    return DownloadSubmission.fromDatabase({
      id: row.id,
      gateId: row.gate_id,
      email: row.email,
      firstName: row.first_name,
      soundcloudUserId: row.soundcloud_user_id,
      soundcloudUsername: row.soundcloud_username,
      soundcloudPermalink: row.soundcloud_permalink,
      spotifyUserId: row.spotify_user_id,
      spotifyDisplayName: row.spotify_display_name,
      emailVerified: row.email_verified,
      soundcloudRepostVerified: row.soundcloud_repost_verified,
      soundcloudRepostVerifiedAt: row.soundcloud_repost_verified_at ? new Date(row.soundcloud_repost_verified_at) : null,
      soundcloudFollowVerified: row.soundcloud_follow_verified,
      soundcloudFollowVerifiedAt: row.soundcloud_follow_verified_at ? new Date(row.soundcloud_follow_verified_at) : null,
      spotifyConnected: row.spotify_connected,
      spotifyConnectedAt: row.spotify_connected_at ? new Date(row.spotify_connected_at) : null,
      downloadToken: row.download_token,
      downloadTokenGeneratedAt: row.download_token_generated_at ? new Date(row.download_token_generated_at) : null,
      downloadTokenExpiresAt: row.download_token_expires_at ? new Date(row.download_token_expires_at) : null,
      downloadCompleted: row.download_completed,
      downloadCompletedAt: row.download_completed_at ? new Date(row.download_completed_at) : null,
      consentMarketing: row.consent_marketing,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
