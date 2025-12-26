import { sql } from '@/lib/db';
import { ITrackRepository, Track } from '@/domain/repositories/ITrackRepository';

export class PostgresTrackRepository implements ITrackRepository {
  async existsByTrackId(trackId: string, userId: number): Promise<boolean> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM soundcloud_tracks
      WHERE track_id = ${trackId} AND user_id = ${userId}
    `;
    return Number(result.rows[0]?.count || 0) > 0;
  }

  async save(track: Track, userId: number): Promise<void> {
    await sql`
      INSERT INTO soundcloud_tracks (user_id, track_id, title, url, published_at, cover_image)
      VALUES (
        ${userId},
        ${track.trackId},
        ${track.title},
        ${track.url},
        ${track.publishedAt},
        ${track.coverImage || null}
      )
      ON CONFLICT (user_id, track_id) DO UPDATE SET
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        cover_image = EXCLUDED.cover_image,
        updated_at = CURRENT_TIMESTAMP
    `;
  }

  async findByTrackId(trackId: string, userId: number): Promise<Track | null> {
    const result = await sql`
      SELECT * FROM soundcloud_tracks
      WHERE track_id = ${trackId} AND user_id = ${userId}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      trackId: row.track_id,
      title: row.title,
      url: row.url,
      publishedAt: row.published_at,
      coverImage: row.cover_image,
      createdAt: row.created_at,
      userId: row.user_id
    };
  }

  async findAll(userId: number): Promise<Track[]> {
    const result = await sql`
      SELECT * FROM soundcloud_tracks
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      trackId: row.track_id,
      title: row.title,
      url: row.url,
      publishedAt: row.published_at,
      coverImage: row.cover_image,
      createdAt: row.created_at,
      userId: row.user_id
    }));
  }

  async getAllTrackIds(userId: number): Promise<Set<string>> {
    const result = await sql`
      SELECT track_id FROM soundcloud_tracks
      WHERE user_id = ${userId}
    `;

    return new Set(result.rows.map((row: any) => row.track_id));
  }
}
