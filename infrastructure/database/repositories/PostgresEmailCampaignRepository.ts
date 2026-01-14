import { sql } from '@/lib/db';
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
   * Multi-tenant: Always associates campaign with user_id
   * Note: Drafts allow null/empty fields for flexibility
   */
  async create(input: CreateCampaignInput): Promise<IEmailCampaign> {
    const result = await sql`
      INSERT INTO email_campaigns (
        user_id,
        template_id,
        track_id,
        subject,
        greeting,
        message,
        signature,
        cover_image_url,
        html_content,
        status,
        scheduled_at
      )
      VALUES (
        ${input.userId},
        ${input.templateId || null},
        ${input.trackId || null},
        ${input.subject || null},
        ${input.greeting || null},
        ${input.message || null},
        ${input.signature || null},
        ${input.coverImageUrl || null},
        ${input.htmlContent || null},
        ${input.status || 'draft'},
        ${input.scheduledAt ? input.scheduledAt.toISOString() : null}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create campaign');
    }

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
   * Multi-tenant: Always filters by user_id if provided
   */
  async findAll(options?: FindCampaignsOptions): Promise<IEmailCampaign[]> {
    // Build WHERE conditions dynamically
    const conditions: string[] = ['1=1'];

    // Multi-tenant isolation: Filter by user_id
    const userId = options?.userId;
    const status = options?.status;
    const trackId = options?.trackId;
    const templateId = options?.templateId;
    const scheduledOnly = options?.scheduledOnly;

    let result;

    // Build query with conditional filters using template literals
    // Vercel Postgres requires template literal syntax
    if (userId && status && trackId && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && status && trackId && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (userId && status && trackId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND track_id = ${trackId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && status && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && trackId && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && status && trackId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND track_id = ${trackId}
        ORDER BY created_at DESC
      `;
    } else if (userId && status && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (userId && status && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && trackId && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (userId && trackId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND track_id = ${trackId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (status && trackId && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId && status) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (userId && trackId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND track_id = ${trackId}
        ORDER BY created_at DESC
      `;
    } else if (userId && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (userId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (status && trackId && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND track_id = ${trackId}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (status && trackId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND track_id = ${trackId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (status && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (trackId && templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE track_id = ${trackId}
          AND template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (status && trackId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND track_id = ${trackId}
        ORDER BY created_at DESC
      `;
    } else if (status && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (status && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (trackId && templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE track_id = ${trackId}
          AND template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (trackId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE track_id = ${trackId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (templateId && scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE template_id = ${templateId}
          AND scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else if (userId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    } else if (status) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (trackId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE track_id = ${trackId}
        ORDER BY created_at DESC
      `;
    } else if (templateId) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE template_id = ${templateId}
        ORDER BY created_at DESC
      `;
    } else if (scheduledOnly) {
      result = await sql`
        SELECT * FROM email_campaigns
        WHERE scheduled_at IS NOT NULL
          AND scheduled_at > NOW()
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM email_campaigns
        ORDER BY created_at DESC
      `;
    }

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
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

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
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

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
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

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
  }

  /**
   * Update campaign
   * Simplified approach: Build SET clause dynamically
   */
  async update(input: UpdateCampaignInput): Promise<IEmailCampaign> {
    // Build update fields dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (input.subject !== undefined) {
      updateFields.push(`subject = $${paramIndex++}`);
      updateValues.push(input.subject);
    }

    if (input.greeting !== undefined) {
      updateFields.push(`greeting = $${paramIndex++}`);
      updateValues.push(input.greeting);
    }

    if (input.message !== undefined) {
      updateFields.push(`message = $${paramIndex++}`);
      updateValues.push(input.message);
    }

    if (input.signature !== undefined) {
      updateFields.push(`signature = $${paramIndex++}`);
      updateValues.push(input.signature);
    }

    if (input.coverImageUrl !== undefined) {
      updateFields.push(`cover_image_url = $${paramIndex++}`);
      updateValues.push(input.coverImageUrl);
    }

    if (input.htmlContent !== undefined) {
      updateFields.push(`html_content = $${paramIndex++}`);
      updateValues.push(input.htmlContent);
    }

    if (input.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(input.status);
    }

    if (input.scheduledAt !== undefined) {
      updateFields.push(`scheduled_at = $${paramIndex++}`);
      updateValues.push(input.scheduledAt ? input.scheduledAt.toISOString() : null);
    }

    if (input.sentAt !== undefined) {
      updateFields.push(`sent_at = $${paramIndex++}`);
      updateValues.push(input.sentAt ? input.sentAt.toISOString() : null);
    }

    // Always update updated_at
    updateFields.push('updated_at = NOW()');

    // Add id as the last parameter
    updateValues.push(input.id);

    // Build and execute query
    const query = `
      UPDATE email_campaigns
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, updateValues);

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

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
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

    return result.rows.map((row: any) => EmailCampaign.fromDatabase(row));
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

    if (result.rows.length === 0) return 0;

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

    if (result.rows.length === 0) return false;

    return result.rows[0].exists;
  }
}
