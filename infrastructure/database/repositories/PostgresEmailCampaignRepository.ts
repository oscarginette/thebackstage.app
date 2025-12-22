import { sql } from '@vercel/postgres';
import {
  IEmailCampaignRepository,
  EmailCampaign as IEmailCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  FindCampaignsOptions
} from '@/domain/repositories/IEmailCampaignRepository';
import { EmailCampaign } from '@/domain/entities/EmailCampaign';

/**
 * PostgreSQL implementation of IEmailCampaignRepository
 * Follows Clean Architecture: Infrastructure layer implements Domain interface
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles campaign data persistence
 * - Dependency Inversion: Depends on IEmailCampaignRepository interface
 */
export class PostgresEmailCampaignRepository implements IEmailCampaignRepository {
  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput): Promise<IEmailCampaign> {
    const result = await sql`
      INSERT INTO email_campaigns (
        template_id,
        track_id,
        subject,
        html_content,
        status,
        scheduled_at
      )
      VALUES (
        ${input.templateId || null},
        ${input.trackId || null},
        ${input.subject},
        ${input.htmlContent},
        ${input.status || 'draft'},
        ${input.scheduledAt ? input.scheduledAt.toISOString() : null}
      )
      RETURNING *
    `;

    return EmailCampaign.fromDatabase(result.rows[0]);
  }

  /**
   * Find campaign by ID
   */
  async findById(id: string): Promise<IEmailCampaign | null> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return EmailCampaign.fromDatabase(result.rows[0]);
  }

  /**
   * Find all campaigns with optional filtering
   */
  async findAll(options?: FindCampaignsOptions): Promise<IEmailCampaign[]> {
    let query = 'SELECT * FROM email_campaigns WHERE 1=1';
    const params: any[] = [];

    if (options?.status) {
      params.push(options.status);
      query += ` AND status = $${params.length}`;
    }

    if (options?.trackId) {
      params.push(options.trackId);
      query += ` AND track_id = $${params.length}`;
    }

    if (options?.templateId) {
      params.push(options.templateId);
      query += ` AND template_id = $${params.length}`;
    }

    if (options?.scheduledOnly) {
      query += ' AND scheduled_at IS NOT NULL AND scheduled_at > NOW()';
    }

    query += ' ORDER BY created_at DESC';

    const result = await sql.query(query, params);
    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Get all draft campaigns
   */
  async getDrafts(): Promise<IEmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE status = 'draft'
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Get all sent campaigns
   */
  async getSent(): Promise<IEmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE status = 'sent'
      ORDER BY sent_at DESC
    `;

    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Get scheduled campaigns (future scheduled_at)
   */
  async getScheduled(): Promise<IEmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE scheduled_at IS NOT NULL
        AND scheduled_at > NOW()
        AND status = 'draft'
      ORDER BY scheduled_at ASC
    `;

    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Update campaign
   */
  async update(input: UpdateCampaignInput): Promise<IEmailCampaign> {
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.subject !== undefined) {
      params.push(input.subject);
      updates.push(`subject = $${paramIndex++}`);
    }

    if (input.htmlContent !== undefined) {
      params.push(input.htmlContent);
      updates.push(`html_content = $${paramIndex++}`);
    }

    if (input.status !== undefined) {
      params.push(input.status);
      updates.push(`status = $${paramIndex++}`);
    }

    if (input.scheduledAt !== undefined) {
      params.push(input.scheduledAt ? input.scheduledAt.toISOString() : null);
      updates.push(`scheduled_at = $${paramIndex++}`);
    }

    if (input.sentAt !== undefined) {
      params.push(input.sentAt ? input.sentAt.toISOString() : null);
      updates.push(`sent_at = $${paramIndex++}`);
    }

    // Always update updated_at
    updates.push('updated_at = NOW()');

    // Add ID as last parameter
    params.push(input.id);

    const query = `
      UPDATE email_campaigns
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, params);

    if (result.rows.length === 0) {
      throw new Error(`Campaign with ID ${input.id} not found`);
    }

    return EmailCampaign.fromDatabase(result.rows[0]);
  }

  /**
   * Delete campaign
   * Hard delete for drafts, soft delete for sent campaigns would be here if needed
   */
  async delete(id: string): Promise<void> {
    await sql`
      DELETE FROM email_campaigns
      WHERE id = ${id}
    `;
  }

  /**
   * Mark campaign as sent
   */
  async markAsSent(id: string): Promise<IEmailCampaign> {
    const result = await sql`
      UPDATE email_campaigns
      SET status = 'sent',
          sent_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error(`Campaign with ID ${id} not found`);
    }

    return EmailCampaign.fromDatabase(result.rows[0]);
  }

  /**
   * Find campaigns by track ID
   */
  async findByTrackId(trackId: string): Promise<IEmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE track_id = ${trackId}
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Find campaigns by template ID
   */
  async findByTemplateId(templateId: string): Promise<IEmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE template_id = ${templateId}
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => EmailCampaign.fromDatabase(row));
  }

  /**
   * Count total campaigns
   */
  async count(status?: 'draft' | 'sent'): Promise<number> {
    let result;

    if (status) {
      result = await sql`
        SELECT COUNT(*) as count
        FROM email_campaigns
        WHERE status = ${status}
      `;
    } else {
      result = await sql`
        SELECT COUNT(*) as count
        FROM email_campaigns
      `;
    }

    return parseInt(result.rows[0].count);
  }

  /**
   * Check if campaign exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT EXISTS(
        SELECT 1 FROM email_campaigns WHERE id = ${id}
      ) as exists
    `;

    return result.rows[0].exists;
  }
}
