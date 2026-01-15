/**
 * GetExecutionHistoryUseCase
 *
 * Retrieves execution history with track information.
 * Returns recent email campaign executions with associated tracks.
 *
 * Clean Architecture: Business logic isolated from database and external API concerns.
 * SOLID: Single Responsibility (only handles execution history retrieval).
 */

import { ITrackRepository } from '@/domain/repositories/ITrackRepository';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { sql } from '@/lib/db';

export interface ExecutionHistoryItem {
  executionLogId: number;
  campaignId: string | null;
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  executedAt: string;
  emailsSent: number;
  durationMs: number;
  coverImage: string | null;
  description: string | null;
}

export interface GetExecutionHistoryResult {
  history: ExecutionHistoryItem[];
}

/**
 * GetExecutionHistoryUseCase
 *
 * Fetches execution history with track details and enrichment from RSS feed.
 *
 * NOTE: This use case still uses direct SQL for the complex JOIN query.
 * Future improvement: Add getExecutionHistoryWithTracks() to IExecutionLogRepository.
 */
export class GetExecutionHistoryUseCase {
  constructor(
    private trackRepository: ITrackRepository,
    private executionLogRepository: IExecutionLogRepository
  ) {}

  /**
   * Execute the use case
   *
   * @returns Execution history with track information
   */
  async execute(): Promise<GetExecutionHistoryResult> {
    try {
      // Fetch execution history from two sources:
      // 1. SoundCloud tracks (new_tracks = 1, has track_id)
      // 2. Custom campaigns (new_tracks = 0, track_id IS NULL)
      // NOTE: This complex query should eventually be moved to repository
      const result = await sql`
        SELECT
          el.id,
          COALESCE(el.track_id, 'campaign-' || el.id) as track_id,
          el.campaign_id,
          COALESCE(st.title, el.track_title, 'Untitled Campaign') as title,
          COALESCE(st.url, '') as url,
          COALESCE(st.published_at, el.executed_at) as published_at,
          st.cover_image,
          st.description,
          el.emails_sent,
          el.duration_ms,
          el.executed_at
        FROM execution_logs el
        LEFT JOIN soundcloud_tracks st ON st.track_id = el.track_id
        WHERE el.emails_sent > 0
        ORDER BY el.executed_at DESC
        LIMIT 20
      `;

      // Transform to domain format
      const history: ExecutionHistoryItem[] = result.rows.map((row: any) => ({
        executionLogId: row.id,
        campaignId: row.campaign_id || null,
        trackId: row.track_id,
        title: row.title,
        url: row.url || '',
        publishedAt: row.published_at,
        executedAt: row.executed_at,
        emailsSent: row.emails_sent || 0,
        durationMs: row.duration_ms || 0,
        coverImage: row.cover_image || null,
        description: row.description || null,
      }));

      return {
        history,
      };
    } catch (error) {
      console.error('GetExecutionHistoryUseCase error:', error);
      // Return empty history on error to avoid breaking UI
      return {
        history: [],
      };
    }
  }
}
