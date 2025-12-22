/**
 * PostgresDownloadAnalyticsRepository
 *
 * PostgreSQL implementation of IDownloadAnalyticsRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Handles analytics event tracking, aggregation, and conversion funnel analysis.
 * Clean Architecture: Infrastructure layer implementation.
 */

import { sql } from '@/lib/db';
import { IDownloadAnalyticsRepository } from '@/domain/repositories/IDownloadAnalyticsRepository';
import {
  CreateAnalyticsInput,
  AnalyticsEvent,
  GateStats,
} from '@/domain/types/download-gates';

export class PostgresDownloadAnalyticsRepository implements IDownloadAnalyticsRepository {
  async track(input: CreateAnalyticsInput): Promise<void> {
    try {
      await sql`
        INSERT INTO download_analytics (
          gate_id,
          event_type,
          session_id,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          ip_address,
          user_agent,
          country
        ) VALUES (
          ${input.gateId},
          ${input.eventType},
          ${input.sessionId ?? null},
          ${input.referrer ?? null},
          ${input.utmSource ?? null},
          ${input.utmMedium ?? null},
          ${input.utmCampaign ?? null},
          ${input.ipAddress ?? null},
          ${input.userAgent ?? null},
          ${input.country ?? null}
        )
      `;
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.track error:', error);
      throw new Error(`Failed to track analytics event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGateStats(gateId: number): Promise<GateStats> {
    try {
      // Get view count
      const viewResult = await sql`
        SELECT COUNT(*) as count
        FROM download_analytics
        WHERE gate_id = ${gateId} AND event_type = 'view'
      `;

      // Get submission and download counts from submissions table
      const submissionResult = await sql`
        SELECT
          COUNT(*) as total_submissions,
          SUM(CASE WHEN download_completed = true THEN 1 ELSE 0 END) as total_downloads,
          SUM(CASE WHEN soundcloud_repost_verified = true THEN 1 ELSE 0 END) as soundcloud_reposts,
          SUM(CASE WHEN soundcloud_follow_verified = true THEN 1 ELSE 0 END) as soundcloud_follows,
          SUM(CASE WHEN spotify_connected = true THEN 1 ELSE 0 END) as spotify_connects
        FROM download_submissions
        WHERE gate_id = ${gateId}
      `;

      const totalViews = parseInt(viewResult.rows[0].count, 10);
      const totalSubmissions = parseInt(submissionResult.rows[0].total_submissions, 10);
      const totalDownloads = parseInt(submissionResult.rows[0].total_downloads, 10);
      const soundcloudReposts = parseInt(submissionResult.rows[0].soundcloud_reposts, 10);
      const soundcloudFollows = parseInt(submissionResult.rows[0].soundcloud_follows, 10);
      const spotifyConnects = parseInt(submissionResult.rows[0].spotify_connects, 10);

      const conversionRate = totalViews > 0
        ? (totalDownloads / totalViews) * 100
        : 0;

      return {
        gateId,
        totalViews,
        totalSubmissions,
        totalDownloads,
        conversionRate,
        soundcloudReposts,
        soundcloudFollows,
        spotifyConnects,
      };
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.getGateStats error:', error);
      throw new Error(`Failed to get gate stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGateAnalytics(
    gateId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    try {
      let result;

      if (startDate && endDate) {
        result = await sql`
          SELECT *
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          ORDER BY created_at DESC
        `;
      } else if (startDate) {
        result = await sql`
          SELECT *
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND created_at >= ${startDate.toISOString()}
          ORDER BY created_at DESC
        `;
      } else if (endDate) {
        result = await sql`
          SELECT *
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND created_at <= ${endDate.toISOString()}
          ORDER BY created_at DESC
        `;
      } else {
        result = await sql`
          SELECT *
          FROM download_analytics
          WHERE gate_id = ${gateId}
          ORDER BY created_at DESC
        `;
      }

      return result.rows.map((row: any) => this.mapToAnalyticsEvent(row));
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.getGateAnalytics error:', error);
      throw new Error(`Failed to get gate analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConversionFunnel(
    gateId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    views: number;
    submissions: number;
    downloads: number;
    viewToSubmit: number;
    submitToDownload: number;
    viewToDownload: number;
  }> {
    try {
      // Get view count from analytics
      let viewResult;
      if (startDate && endDate) {
        viewResult = await sql`
          SELECT COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
        `;
      } else if (startDate) {
        viewResult = await sql`
          SELECT COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
        `;
      } else if (endDate) {
        viewResult = await sql`
          SELECT COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at <= ${endDate.toISOString()}
        `;
      } else {
        viewResult = await sql`
          SELECT COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
        `;
      }

      // Get submission and download counts
      let submissionResult;
      if (startDate && endDate) {
        submissionResult = await sql`
          SELECT
            COUNT(*) as submissions,
            SUM(CASE WHEN download_completed = true THEN 1 ELSE 0 END) as downloads
          FROM download_submissions
          WHERE gate_id = ${gateId}
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
        `;
      } else if (startDate) {
        submissionResult = await sql`
          SELECT
            COUNT(*) as submissions,
            SUM(CASE WHEN download_completed = true THEN 1 ELSE 0 END) as downloads
          FROM download_submissions
          WHERE gate_id = ${gateId}
            AND created_at >= ${startDate.toISOString()}
        `;
      } else if (endDate) {
        submissionResult = await sql`
          SELECT
            COUNT(*) as submissions,
            SUM(CASE WHEN download_completed = true THEN 1 ELSE 0 END) as downloads
          FROM download_submissions
          WHERE gate_id = ${gateId}
            AND created_at <= ${endDate.toISOString()}
        `;
      } else {
        submissionResult = await sql`
          SELECT
            COUNT(*) as submissions,
            SUM(CASE WHEN download_completed = true THEN 1 ELSE 0 END) as downloads
          FROM download_submissions
          WHERE gate_id = ${gateId}
        `;
      }

      const views = parseInt(viewResult.rows[0].count, 10);
      const submissions = parseInt(submissionResult.rows[0].submissions, 10);
      const downloads = parseInt(submissionResult.rows[0].downloads || '0', 10);

      const viewToSubmit = views > 0 ? (submissions / views) * 100 : 0;
      const submitToDownload = submissions > 0 ? (downloads / submissions) * 100 : 0;
      const viewToDownload = views > 0 ? (downloads / views) * 100 : 0;

      return {
        views,
        submissions,
        downloads,
        viewToSubmit,
        submitToDownload,
        viewToDownload,
      };
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.getConversionFunnel error:', error);
      throw new Error(`Failed to get conversion funnel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTrafficSources(
    gateId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      referrer: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      count: number;
    }>
  > {
    try {
      let result;

      if (startDate && endDate) {
        result = await sql`
          SELECT
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY referrer, utm_source, utm_medium, utm_campaign
          ORDER BY count DESC
        `;
      } else if (startDate) {
        result = await sql`
          SELECT
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
          GROUP BY referrer, utm_source, utm_medium, utm_campaign
          ORDER BY count DESC
        `;
      } else if (endDate) {
        result = await sql`
          SELECT
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at <= ${endDate.toISOString()}
          GROUP BY referrer, utm_source, utm_medium, utm_campaign
          ORDER BY count DESC
        `;
      } else {
        result = await sql`
          SELECT
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            COUNT(*) as count
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
          GROUP BY referrer, utm_source, utm_medium, utm_campaign
          ORDER BY count DESC
        `;
      }

      return result.rows.map((row: any) => ({
        referrer: row.referrer,
        utmSource: row.utm_source,
        utmMedium: row.utm_medium,
        utmCampaign: row.utm_campaign,
        count: parseInt(row.count, 10),
      }));
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.getTrafficSources error:', error);
      throw new Error(`Failed to get traffic sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGeographicDistribution(
    gateId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      country: string | null;
      views: number;
      downloads: number;
    }>
  > {
    try {
      // Get view counts by country
      let viewResult;
      if (startDate && endDate) {
        viewResult = await sql`
          SELECT
            country,
            COUNT(*) as views
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY country
          ORDER BY views DESC
        `;
      } else if (startDate) {
        viewResult = await sql`
          SELECT
            country,
            COUNT(*) as views
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at >= ${startDate.toISOString()}
          GROUP BY country
          ORDER BY views DESC
        `;
      } else if (endDate) {
        viewResult = await sql`
          SELECT
            country,
            COUNT(*) as views
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
            AND created_at <= ${endDate.toISOString()}
          GROUP BY country
          ORDER BY views DESC
        `;
      } else {
        viewResult = await sql`
          SELECT
            country,
            COUNT(*) as views
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'view'
          GROUP BY country
          ORDER BY views DESC
        `;
      }

      // Get download counts by country (from analytics download events)
      let downloadResult;
      if (startDate && endDate) {
        downloadResult = await sql`
          SELECT
            country,
            COUNT(*) as downloads
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'download'
            AND created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY country
        `;
      } else if (startDate) {
        downloadResult = await sql`
          SELECT
            country,
            COUNT(*) as downloads
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'download'
            AND created_at >= ${startDate.toISOString()}
          GROUP BY country
        `;
      } else if (endDate) {
        downloadResult = await sql`
          SELECT
            country,
            COUNT(*) as downloads
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'download'
            AND created_at <= ${endDate.toISOString()}
          GROUP BY country
        `;
      } else {
        downloadResult = await sql`
          SELECT
            country,
            COUNT(*) as downloads
          FROM download_analytics
          WHERE gate_id = ${gateId}
            AND event_type = 'download'
          GROUP BY country
        `;
      }

      // Merge view and download counts
      const downloadMap = new Map<string | null, number>();
      downloadResult.rows.forEach((row: any) => {
        downloadMap.set(row.country, parseInt(row.downloads, 10));
      });

      return viewResult.rows.map((row: any) => ({
        country: row.country,
        views: parseInt(row.views, 10),
        downloads: downloadMap.get(row.country) || 0,
      }));
    } catch (error) {
      console.error('PostgresDownloadAnalyticsRepository.getGeographicDistribution error:', error);
      throw new Error(`Failed to get geographic distribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to AnalyticsEvent
   */
  private mapToAnalyticsEvent(row: any): AnalyticsEvent {
    return {
      id: row.id,
      gateId: row.gate_id,
      eventType: row.event_type,
      sessionId: row.session_id,
      referrer: row.referrer,
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      country: row.country,
      createdAt: new Date(row.created_at),
    };
  }
}
