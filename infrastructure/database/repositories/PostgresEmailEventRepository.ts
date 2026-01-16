import { sql } from '@/lib/db';
import { IEmailEventRepository, EmailEventRecord, EmailEventStats } from '@/domain/repositories/IEmailEventRepository';

export class PostgresEmailEventRepository implements IEmailEventRepository {
  async create(event: EmailEventRecord): Promise<void> {
    await sql`
      INSERT INTO email_events (
        email_log_id,
        contact_id,
        track_id,
        event_type,
        event_data,
        resend_email_id
      ) VALUES (
        ${event.emailLogId},
        ${event.contactId},
        ${event.trackId},
        ${event.eventType},
        ${JSON.stringify(event.eventData)},
        ${event.resendEmailId}
      )
    `;
  }

  async updateEmailLogDelivered(logId: number): Promise<void> {
    await sql`
      UPDATE email_logs
      SET delivered_at = NOW()
      WHERE id = ${logId}
    `;
  }

  async updateEmailLogOpened(logId: number): Promise<void> {
    await sql`
      UPDATE email_logs
      SET
        opened_at = COALESCE(opened_at, NOW()),
        open_count = COALESCE(open_count, 0) + 1
      WHERE id = ${logId}
    `;
  }

  async updateEmailLogClicked(logId: number, url: string): Promise<void> {
    await sql`
      UPDATE email_logs
      SET
        clicked_at = COALESCE(clicked_at, NOW()),
        click_count = COALESCE(click_count, 0) + 1,
        clicked_urls = COALESCE(clicked_urls, '[]'::jsonb) || ${JSON.stringify([url])}::jsonb
      WHERE id = ${logId}
    `;
  }

  async updateEmailLogBounced(logId: number, reason: string): Promise<void> {
    await sql`
      UPDATE email_logs
      SET error = ${reason}
      WHERE id = ${logId}
    `;
  }

  async findEmailLogByResendId(resendEmailId: string): Promise<{id: number; contact_id: number; track_id: string} | null> {
    const result = await sql`
      SELECT id, contact_id, track_id
      FROM email_logs
      WHERE resend_email_id = ${resendEmailId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as {id: number; contact_id: number; track_id: string};
  }

  /**
   * Get aggregated event statistics for a campaign
   * Used by warm-up health monitoring
   */
  async getStatsForCampaign(campaignId: string): Promise<EmailEventStats> {
    const result = await sql`
      SELECT
        COUNT(DISTINCT el.id) as total_sent,
        SUM(CASE WHEN ee.event_type = 'email.delivered' THEN 1 ELSE 0 END) as total_delivered,
        SUM(CASE WHEN ee.event_type = 'email.bounced' THEN 1 ELSE 0 END) as total_bounced,
        SUM(CASE WHEN ee.event_type = 'email.spam_complaint' THEN 1 ELSE 0 END) as total_complaints,
        SUM(CASE WHEN ee.event_type = 'email.opened' THEN 1 ELSE 0 END) as total_opened,
        SUM(CASE WHEN ee.event_type = 'email.clicked' THEN 1 ELSE 0 END) as total_clicked
      FROM email_logs el
      LEFT JOIN email_events ee ON ee.email_log_id = el.id
      WHERE el.campaign_id = ${parseInt(campaignId)}
    `;

    if (result.rows.length === 0) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalBounced: 0,
        totalComplaints: 0,
        totalOpened: 0,
        totalClicked: 0,
      };
    }

    const row = result.rows[0];

    return {
      totalSent: parseInt(row.total_sent) || 0,
      totalDelivered: parseInt(row.total_delivered) || 0,
      totalBounced: parseInt(row.total_bounced) || 0,
      totalComplaints: parseInt(row.total_complaints) || 0,
      totalOpened: parseInt(row.total_opened) || 0,
      totalClicked: parseInt(row.total_clicked) || 0,
    };
  }
}
