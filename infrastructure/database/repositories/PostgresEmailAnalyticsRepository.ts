import { sql } from '@/lib/db';
import {
  IEmailAnalyticsRepository,
  EventsSummary,
  RecentEvent,
  TrackStats,
  EngagedContact,
  CampaignStat
} from '@/domain/repositories/IEmailAnalyticsRepository';
import { EmailMetrics } from '@/domain/value-objects/EmailMetrics';

export class PostgresEmailAnalyticsRepository implements IEmailAnalyticsRepository {
  async getEventsSummary(): Promise<EventsSummary[]> {
    const result = await sql`
      SELECT
        event_type,
        COUNT(*) as total,
        COUNT(DISTINCT contact_id) as unique_contacts,
        COUNT(DISTINCT track_id) as unique_tracks
      FROM email_events
      GROUP BY event_type
      ORDER BY total DESC
    `;

    return result.rows.map((row: any) => ({
      event_type: row.event_type,
      total: Number(row.total),
      unique_contacts: Number(row.unique_contacts),
      unique_tracks: Number(row.unique_tracks)
    }));
  }

  async getRecentEvents(limit: number): Promise<RecentEvent[]> {
    const result = await sql`
      SELECT
        ee.event_type,
        ee.created_at,
        c.email,
        c.name,
        st.title as track_title,
        ee.event_data
      FROM email_events ee
      JOIN contacts c ON ee.contact_id = c.id
      LEFT JOIN soundcloud_tracks st ON ee.track_id = st.track_id
      ORDER BY ee.created_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: any) => ({
      event_type: row.event_type,
      created_at: row.created_at,
      email: row.email,
      name: row.name,
      track_title: row.track_title,
      event_data: row.event_data
    }));
  }

  async getTrackStats(): Promise<TrackStats[]> {
    const result = await sql`
      SELECT
        st.title,
        st.track_id,
        COUNT(CASE WHEN ee.event_type = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN ee.event_type = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as opened,
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as clicked,
        COUNT(CASE WHEN ee.event_type = 'bounced' THEN 1 END) as bounced,
        COUNT(DISTINCT ee.contact_id) as unique_recipients
      FROM soundcloud_tracks st
      LEFT JOIN email_events ee ON st.track_id = ee.track_id
      GROUP BY st.title, st.track_id
      ORDER BY st.published_at DESC
    `;

    return result.rows.map((row: any) => ({
      title: row.title,
      track_id: row.track_id,
      sent: Number(row.sent),
      delivered: Number(row.delivered),
      opened: Number(row.opened),
      clicked: Number(row.clicked),
      bounced: Number(row.bounced),
      unique_recipients: Number(row.unique_recipients)
    }));
  }

  async getTopEngagedContacts(limit: number): Promise<EngagedContact[]> {
    const result = await sql`
      SELECT
        c.email,
        c.name,
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as opens,
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as clicks,
        MAX(ee.created_at) as last_interaction
      FROM contacts c
      JOIN email_events ee ON c.id = ee.contact_id
      WHERE ee.event_type IN ('opened', 'clicked')
      GROUP BY c.email, c.name
      ORDER BY (
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) * 2 +
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END)
      ) DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: any) => ({
      email: row.email,
      name: row.name,
      opens: Number(row.opens),
      clicks: Number(row.clicks),
      last_interaction: row.last_interaction
    }));
  }

  async getConversionMetrics(): Promise<EmailMetrics> {
    const result = await sql`
      WITH stats AS (
        SELECT
          COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as total_sent,
          COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as total_delivered,
          COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as total_opened,
          COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as total_clicked,
          COUNT(CASE WHEN event_type = 'bounced' THEN 1 END) as total_bounced
        FROM email_events
      )
      SELECT
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_bounced
      FROM stats
    `;

    const row = result.rows[0];

    return new EmailMetrics(
      Number(row?.total_sent || 0),
      Number(row?.total_delivered || 0),
      Number(row?.total_opened || 0),
      Number(row?.total_clicked || 0),
      Number(row?.total_bounced || 0)
    );
  }

  async getCampaignStats(trackId?: string): Promise<CampaignStat[]> {
    let result;

    if (trackId) {
      result = await sql`
        SELECT
          st.track_id,
          st.title as track_title,
          st.url as track_url,
          st.published_at,
          COUNT(DISTINCT el.id) as total_sent,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END) as delivered,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END) as opened,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END) as clicked,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END) as bounced
        FROM soundcloud_tracks st
        LEFT JOIN email_logs el ON st.track_id = el.track_id
        LEFT JOIN email_events ee ON el.id = ee.email_log_id
        WHERE el.id IS NOT NULL AND st.track_id = ${trackId}
        GROUP BY st.track_id, st.title, st.url, st.published_at
      `;
    } else {
      result = await sql`
        SELECT
          st.track_id,
          st.title as track_title,
          st.url as track_url,
          st.published_at,
          COUNT(DISTINCT el.id) as total_sent,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END) as delivered,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END) as opened,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END) as clicked,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END) as bounced
        FROM soundcloud_tracks st
        LEFT JOIN email_logs el ON st.track_id = el.track_id
        LEFT JOIN email_events ee ON el.id = ee.email_log_id
        WHERE el.id IS NOT NULL
        GROUP BY st.track_id, st.title, st.url, st.published_at
        ORDER BY st.published_at DESC
        LIMIT 50
      `;
    }

    return result.rows.map((row: any) => ({
      track_id: row.track_id,
      track_title: row.track_title,
      track_url: row.track_url,
      published_at: row.published_at,
      total_sent: Number(row.total_sent),
      delivered: Number(row.delivered),
      opened: Number(row.opened),
      clicked: Number(row.clicked),
      bounced: Number(row.bounced)
    }));
  }
}

export const emailAnalyticsRepository = new PostgresEmailAnalyticsRepository();
