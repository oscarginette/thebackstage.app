import { sql } from '@vercel/postgres';
import { IEmailLogRepository, EmailLog } from '@/domain/repositories/IEmailLogRepository';

export class PostgresEmailLogRepository implements IEmailLogRepository {
  async create(log: Omit<EmailLog, 'id' | 'createdAt'>): Promise<void> {
    await sql`
      INSERT INTO email_logs (contact_id, track_id, resend_email_id, status, error)
      VALUES (
        ${log.contactId},
        ${log.trackId},
        ${log.resendEmailId || null},
        ${log.status},
        ${log.error || null}
      )
    `;
  }

  async findByTrackId(trackId: string): Promise<EmailLog[]> {
    const result = await sql`
      SELECT * FROM email_logs WHERE track_id = ${trackId} ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      contactId: row.contact_id,
      trackId: row.track_id,
      resendEmailId: row.resend_email_id,
      status: row.status,
      error: row.error,
      createdAt: row.created_at
    }));
  }

  async updateStatus(resendEmailId: string, status: EmailLog['status']): Promise<void> {
    await sql`
      UPDATE email_logs
      SET status = ${status}
      WHERE resend_email_id = ${resendEmailId}
    `;
  }
}
