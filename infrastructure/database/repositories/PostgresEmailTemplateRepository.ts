import { sql } from '@/lib/db';
import {
  IEmailTemplateRepository,
  CreateTemplateInput,
  UpdateTemplateInput,
  FindTemplatesOptions
} from '@/domain/repositories/IEmailTemplateRepository';
import { EmailTemplate } from '@/domain/entities/EmailTemplate';

/**
 * PostgreSQL implementation of IEmailTemplateRepository
 * Follows Clean Architecture: Infrastructure layer implements Domain interface
 */
export class PostgresEmailTemplateRepository implements IEmailTemplateRepository {
  /**
   * Create a new template
   */
  async create(input: CreateTemplateInput): Promise<EmailTemplate> {
    const result = await sql`
      INSERT INTO email_templates (
        name,
        description,
        mjml_content,
        html_snapshot,
        is_default,
        parent_template_id
      )
      VALUES (
        ${input.name},
        ${input.description || null},
        ${JSON.stringify(input.mjmlContent)}::jsonb,
        ${input.htmlSnapshot},
        ${input.isDefault || false},
        ${input.parentTemplateId || null}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create template');
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<EmailTemplate | null> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) return null;
    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find all templates with optional filters
   */
  async findAll(options?: FindTemplatesOptions): Promise<EmailTemplate[]> {
    const includeDeleted = options?.includeDeleted || false;
    const onlyDefault = options?.onlyDefault || false;
    const parentTemplateId = options?.parentTemplateId;

    let query = `SELECT * FROM email_templates WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    // Filter soft-deleted templates
    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    // Filter by default status
    if (onlyDefault) {
      query += ` AND is_default = true`;
    }

    // Filter by parent template
    if (parentTemplateId) {
      query += ` AND parent_template_id = $${paramCount}`;
      params.push(parentTemplateId);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await sql.query(query, params);
    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Update template
   */
  async update(input: UpdateTemplateInput): Promise<EmailTemplate> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(input.name);
      paramCount++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(input.description);
      paramCount++;
    }

    if (input.mjmlContent !== undefined) {
      updates.push(`mjml_content = $${paramCount}::jsonb`);
      params.push(JSON.stringify(input.mjmlContent));
      paramCount++;
    }

    if (input.htmlSnapshot !== undefined) {
      updates.push(`html_snapshot = $${paramCount}`);
      params.push(input.htmlSnapshot);
      paramCount++;
    }

    if (input.isDefault !== undefined) {
      updates.push(`is_default = $${paramCount}`);
      params.push(input.isDefault);
      paramCount++;
    }

    if (updates.length === 0) {
      // No updates, just return current template
      const existing = await this.findById(input.id);
      if (!existing) {
        throw new Error(`Template with id ${input.id} not found`);
      }
      return existing;
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add ID parameter
    params.push(input.id);
    const idParam = paramCount;

    const query = `
      UPDATE email_templates
      SET ${updates.join(', ')}
      WHERE id = $${idParam}
      RETURNING *
    `;

    const result = await sql.query(query, params);

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${input.id} not found`);
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Soft delete template
   */
  async delete(id: string): Promise<void> {
    const result = await sql`
      UPDATE email_templates
      SET
        deleted_at = CURRENT_TIMESTAMP,
        is_default = false
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${id} not found`);
    }
  }

  /**
   * Get the default template
   */
  async findDefault(): Promise<EmailTemplate | null> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE is_default = true
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;
    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Set a template as default
   * Automatically unsets previous default
   */
  async setDefault(id: string): Promise<void> {
    // Use a transaction to ensure atomicity
    await sql.query('BEGIN');

    try {
      // First, unset all defaults
      await sql`
        UPDATE email_templates
        SET is_default = false
        WHERE is_default = true
      `;

      // Then set the new default
      const result = await sql`
        UPDATE email_templates
        SET is_default = true
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `;

      if (result.rows.length === 0) {
        throw new Error(`Template with id ${id} not found or is deleted`);
      }

      await sql.query('COMMIT');
    } catch (error) {
      await sql.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get all versions of a template
   */
  async findVersions(templateId: string): Promise<EmailTemplate[]> {
    // First, find the root template (parent_template_id IS NULL)
    const rootResult = await sql`
      SELECT * FROM email_templates
      WHERE id = ${templateId} AND parent_template_id IS NULL
    `;

    let rootId: string;

    if (rootResult.rows.length > 0) {
      // This is already the root template
      rootId = templateId;
    } else {
      // This might be a version, find its root
      const versionResult = await sql`
        SELECT parent_template_id FROM email_templates
        WHERE id = ${templateId}
      `;

      if (versionResult.rows.length === 0) {
        throw new Error(`Template with id ${templateId} not found`);
      }

      rootId = versionResult.rows[0].parent_template_id;

      if (!rootId) {
        // This is a standalone template with no versions
        const template = await this.findById(templateId);
        return template ? [template] : [];
      }
    }

    // Get all versions including the root
    const result = await sql`
      SELECT * FROM email_templates
      WHERE id = ${rootId} OR parent_template_id = ${rootId}
      ORDER BY version DESC
    `;

    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Create a new version of an existing template
   */
  async createVersion(
    templateId: string,
    mjmlContent: object,
    htmlSnapshot: string
  ): Promise<EmailTemplate> {
    // Get the current template
    const currentTemplate = await this.findById(templateId);
    if (!currentTemplate) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // Determine the parent ID
    const parentId = currentTemplate.parentTemplateId || currentTemplate.id;

    // Get all versions to determine the next version number
    const versions = await this.findVersions(templateId);
    const maxVersion = Math.max(...versions.map(v => v.version));
    const newVersion = maxVersion + 1;

    // Create the new version
    const result = await sql`
      INSERT INTO email_templates (
        name,
        description,
        mjml_content,
        html_snapshot,
        is_default,
        version,
        parent_template_id
      )
      VALUES (
        ${currentTemplate.name},
        ${currentTemplate.description},
        ${JSON.stringify(mjmlContent)}::jsonb,
        ${htmlSnapshot},
        false,
        ${newVersion},
        ${parentId}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create template version');
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find templates by name (search with partial matching)
   */
  async findByName(name: string): Promise<EmailTemplate[]> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE name ILIKE ${'%' + name + '%'}
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Count total templates
   */
  async count(includeDeleted?: boolean): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM email_templates';

    if (!includeDeleted) {
      query += ' WHERE deleted_at IS NULL';
    }

    const result = await sql.query(query);

    if (result.rows.length === 0) return 0;

    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(templateId: string): Promise<{
    totalEmailsSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }> {
    const result = await sql`
      SELECT
        template_id,
        total_emails_sent,
        delivered,
        opened,
        clicked,
        COALESCE(open_rate, 0) as open_rate,
        COALESCE(click_rate, 0) as click_rate
      FROM template_usage_stats
      WHERE template_id = ${templateId}
    `;

    if (result.rows.length === 0) {
      return {
        totalEmailsSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0
      };
    }

    const row = result.rows[0];
    return {
      totalEmailsSent: Number(row.total_emails_sent || 0),
      delivered: Number(row.delivered || 0),
      opened: Number(row.opened || 0),
      clicked: Number(row.clicked || 0),
      openRate: Number(row.open_rate || 0),
      clickRate: Number(row.click_rate || 0)
    };
  }
}
