/**
 * PostgresUserSettingsRepository
 *
 * Concrete implementation of IUserSettingsRepository for PostgreSQL.
 * Implements Dependency Inversion Principle - domain depends on interface, not this.
 */
import { sql } from '@/lib/db';
import { UserSettings } from '@/domain/entities/UserSettings';
import { IUserSettingsRepository, UpdateUserSettingsInput } from '@/domain/repositories/IUserSettingsRepository';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class PostgresUserSettingsRepository implements IUserSettingsRepository {

  async getByUserId(userId: number): Promise<UserSettings> {
    const result = await sql`
      SELECT
        id,
        name,
        soundcloud_id,
        spotify_id,
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
      row.spotify_id,
      new Date(row.updated_at)
    );
  }

  async update(userId: number, input: UpdateUserSettingsInput): Promise<UserSettings> {
    // Build dynamic update query (only update provided fields)
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.soundcloudId !== undefined) {
      updates.push(`soundcloud_id = $${paramIndex++}`);
      values.push(input.soundcloudId);
    }

    if (input.spotifyId !== undefined) {
      updates.push(`spotify_id = $${paramIndex++}`);
      values.push(input.spotifyId);
    }

    if (updates.length === 0) {
      // No updates requested, just return current settings
      return this.getByUserId(userId);
    }

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    values.push(userId); // Last parameter is the WHERE condition

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, soundcloud_id, spotify_id, updated_at
    `;

    const result = await sql.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const row = result.rows[0];

    return new UserSettings(
      row.id,
      row.name,
      row.soundcloud_id,
      row.spotify_id,
      new Date(row.updated_at)
    );
  }
}
