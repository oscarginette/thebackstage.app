/**
 * PostgresUserSettingsRepository
 *
 * Concrete implementation of IUserSettingsRepository for PostgreSQL.
 * Implements Dependency Inversion Principle - domain depends on interface, not this.
 */
import { sql } from '@/lib/db';
import { UserSettings } from '@/domain/entities/UserSettings';
import { IUserSettingsRepository, UpdateUserSettingsInput } from '@/domain/repositories/IUserSettingsRepository';
import { NotFoundError } from '@/lib/errors';

export class PostgresUserSettingsRepository implements IUserSettingsRepository {

  async getByUserId(userId: number): Promise<UserSettings> {
    const result = await sql`
      SELECT
        id,
        name,
        soundcloud_id,
        soundcloud_permalink,
        spotify_id,
        instagram_url,
        updated_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const row = result.rows[0];

    return new UserSettings(
      row.id,
      row.name,
      row.soundcloud_id,
      row.soundcloud_permalink,
      row.spotify_id,
      row.instagram_url,
      null, // sender_email - not yet implemented
      null, // sender_name - not yet implemented
      new Date(row.updated_at)
    );
  }

  async update(userId: number, input: UpdateUserSettingsInput): Promise<UserSettings> {
    // Fetch current settings first
    const current = await this.getByUserId(userId);

    // Merge with updates (undefined means "don't change")
    const name = input.name !== undefined ? input.name : current.name;
    const soundcloudId = input.soundcloudId !== undefined ? input.soundcloudId : current.soundcloudId;
    const soundcloudPermalink = input.soundcloudPermalink !== undefined ? input.soundcloudPermalink : current.soundcloudPermalink;
    const spotifyId = input.spotifyId !== undefined ? input.spotifyId : current.spotifyId;
    const instagramUrl = input.instagramUrl !== undefined ? input.instagramUrl : current.instagramUrl;

    // Update all fields explicitly using Vercel Postgres template literal syntax
    const result = await sql`
      UPDATE users
      SET
        name = ${name},
        soundcloud_id = ${soundcloudId},
        soundcloud_permalink = ${soundcloudPermalink},
        spotify_id = ${spotifyId},
        instagram_url = ${instagramUrl},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, soundcloud_id, soundcloud_permalink, spotify_id, instagram_url, updated_at
    `;

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const row = result.rows[0];

    return new UserSettings(
      row.id,
      row.name,
      row.soundcloud_id,
      row.soundcloud_permalink,
      row.spotify_id,
      row.instagram_url,
      null, // sender_email - not yet implemented
      null, // sender_name - not yet implemented
      new Date(row.updated_at)
    );
  }
}
