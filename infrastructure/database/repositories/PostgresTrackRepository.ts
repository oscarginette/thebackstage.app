import { sql } from '@/lib/db';
import { ITrackRepository, Track } from '@/domain/repositories/ITrackRepository';

export class PostgresTrackRepository implements ITrackRepository {
  async existsByTrackId(trackId: string): Promise<boolean> {
    const result = await sql`
      SELECT COUNT(*) as count FROM soundcloud_tracks WHERE track_id = ${trackId}
    `;
    return Number(result.rows[0]?.count || 0) > 0;
  }

  async save(track: Track): Promise<void> {
    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at, cover_image)
      VALUES (
        ${track.trackId},
        ${track.title},
        ${track.url},
        ${track.publishedAt},
        ${track.coverImage || null}
      )
    `;
  }

  async findByTrackId(trackId: string): Promise<Track | null> {
    const result = await sql`
      SELECT * FROM soundcloud_tracks WHERE track_id = ${trackId}
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
      createdAt: row.created_at
    };
  }

  async findAll(): Promise<Track[]> {
    const result = await sql`
      SELECT * FROM soundcloud_tracks ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      trackId: row.track_id,
      title: row.title,
      url: row.url,
      publishedAt: row.published_at,
      coverImage: row.cover_image,
      createdAt: row.created_at
    }));
  }

  async getAllTrackIds(): Promise<Set<string>> {
    const result = await sql`
      SELECT track_id FROM soundcloud_tracks
    `;

    return new Set(result.rows.map(row => row.track_id));
  }
}
