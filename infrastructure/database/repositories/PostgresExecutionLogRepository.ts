import { sql } from '@/lib/db';
import { IExecutionLogRepository, ExecutionLog } from '@/domain/repositories/IExecutionLogRepository';

export class PostgresExecutionLogRepository implements IExecutionLogRepository {
  async create(log: Omit<ExecutionLog, 'id' | 'createdAt'>): Promise<void> {
    await sql`
      INSERT INTO execution_logs (
        user_id,
        campaign_id,
        new_tracks,
        emails_sent,
        duration_ms,
        track_id,
        track_title,
        error
      )
      VALUES (
        ${log.userId || null},
        ${log.campaignId || null},
        ${log.newTracks || null},
        ${log.emailsSent || null},
        ${log.durationMs || null},
        ${log.trackId || null},
        ${log.trackTitle || null},
        ${log.error || null}
      )
    `;
  }

  async findRecent(limit: number): Promise<ExecutionLog[]> {
    const result = await sql`
      SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT ${limit}
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      newTracks: row.new_tracks,
      emailsSent: row.emails_sent,
      durationMs: row.duration_ms,
      trackId: row.track_id,
      trackTitle: row.track_title,
      error: row.error,
      createdAt: row.created_at
    }));
  }

  async findById(id: number): Promise<ExecutionLog | null> {
    const result = await sql`
      SELECT * FROM execution_logs WHERE id = ${id} LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      newTracks: row.new_tracks,
      emailsSent: row.emails_sent,
      durationMs: row.duration_ms,
      trackId: row.track_id,
      trackTitle: row.track_title,
      error: row.error,
      createdAt: row.created_at
    };
  }
}
