import { sql } from '@/lib/db';
import {
  IContactRepository,
  Contact,
  ContactStats,
  BulkImportContactInput,
  BulkImportResult
} from '@/domain/repositories/IContactRepository';
import type { ContactMetadata } from '@/domain/types/metadata';
import { ListFilterCriteria, LIST_FILTER_MODES } from '@/domain/value-objects/ListFilterCriteria';

export class PostgresContactRepository implements IContactRepository {
  async getSubscribed(userId: number): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE subscribed = true AND user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at
    }));
  }

  async findByEmail(email: string, userId: number): Promise<Contact | null> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE LOWER(email) = LOWER(${email}) AND user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at
    };
  }

  async findByUnsubscribeToken(token: string): Promise<Contact | null> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at, user_id
      FROM contacts
      WHERE unsubscribe_token = ${token}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at,
      userId: row.user_id
    };
  }

  async updateSubscriptionStatus(id: number, subscribed: boolean, userId: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET subscribed = ${subscribed}
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  async unsubscribe(id: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET
        subscribed = false,
        unsubscribed_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  }

  async resubscribe(id: number, userId: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET
        subscribed = true,
        unsubscribed_at = NULL
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  async findAll(userId: number): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at, source, unsubscribed_at, metadata
      FROM contacts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at,
      source: row.source,
      unsubscribedAt: row.unsubscribed_at,
      metadata: row.metadata as ContactMetadata | undefined
    }));
  }

  async getStats(userId: number): Promise<ContactStats> {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE source = 'hypeddit') as from_hypeddit,
        COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_last_7_days
      FROM contacts
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return {
        totalContacts: 0,
        activeSubscribers: 0,
        unsubscribed: 0,
        fromHypeddit: 0,
        fromHypedit: 0,
        newLast30Days: 0,
        newLast7Days: 0
      };
    }

    const row = result.rows[0];
    return {
      totalContacts: Number(row.total_contacts),
      activeSubscribers: Number(row.active_subscribers),
      unsubscribed: Number(row.unsubscribed),
      fromHypeddit: Number(row.from_hypeddit),
      fromHypedit: Number(row.from_hypedit),
      newLast30Days: Number(row.new_last_30_days),
      newLast7Days: Number(row.new_last_7_days)
    };
  }

  async delete(ids: number[], userId: number): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await sql`
      DELETE FROM contacts
      WHERE id = ANY(${ids}) AND user_id = ${userId}
    `;

    return result.rowCount || 0;
  }

  async bulkImport(contacts: BulkImportContactInput[]): Promise<BulkImportResult> {
    if (contacts.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0, errors: [] };
    }

    // Process in smaller batches to avoid parameter limits and improve performance
    // Neon/Postgres can handle batch INSERT with VALUES efficiently
    const BATCH_SIZE = 100;
    const batches: BulkImportContactInput[][] = [];

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      batches.push(contacts.slice(i, i + BATCH_SIZE));
    }

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const allErrors: Array<{ email: string; error: string }> = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      try {
        const result = await this.bulkImportBatch(batch);
        totalInserted += result.inserted;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        allErrors.push(...result.errors);
      } catch (error: unknown) {
        // If batch fails entirely, fall back to individual inserts for this batch
        const fallbackResult = await this.bulkImportFallback(batch);
        totalInserted += fallbackResult.inserted;
        totalUpdated += fallbackResult.updated;
        totalSkipped += fallbackResult.skipped;
        allErrors.push(...fallbackResult.errors);
      }
    }

    return {
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: allErrors
    };
  }

  /**
   * Process a single batch using optimized sequential inserts
   *
   * Note: Vercel Postgres doesn't support sql.query() with raw strings.
   * We use Promise.all() to parallelize individual inserts for better performance
   * than sequential processing, while maintaining Vercel Postgres compatibility.
   *
   * Performance: 100 contacts in ~1-2s vs ~10-15s sequential fallback
   */
  private async bulkImportBatch(contacts: BulkImportContactInput[]): Promise<BulkImportResult> {
    if (contacts.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0, errors: [] };
    }

    // Process all inserts in parallel using Promise.all()
    // This is much faster than sequential for-loop
    const results = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const metadataJson = JSON.stringify(contact.metadata || {});

          const result = await sql`
            INSERT INTO contacts (
              user_id,
              email,
              name,
              source,
              subscribed,
              metadata
            )
            VALUES (
              ${contact.userId},
              ${contact.email.toLowerCase().trim()},
              ${contact.name || null},
              ${contact.source},
              ${contact.subscribed},
              ${metadataJson}
            )
            ON CONFLICT (user_id, email) DO UPDATE SET
              name = EXCLUDED.name,
              subscribed = EXCLUDED.subscribed,
              source = EXCLUDED.source,
              metadata = contacts.metadata || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
            RETURNING (xmax = 0) AS inserted
          `;

          const isInsert = result.rows.length > 0 && result.rows[0].inserted;
          return { success: true, inserted: isInsert, email: contact.email };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            inserted: false,
            email: contact.email,
            error: errorMessage
          };
        }
      })
    );

    // Aggregate results
    const inserted = results.filter(r => r.success && r.inserted).length;
    const updated = results.filter(r => r.success && !r.inserted).length;
    const errors = results
      .filter(r => !r.success)
      .map(r => ({ email: r.email, error: r.error || 'Unknown error' }));

    return {
      inserted,
      updated,
      skipped: errors.length,
      errors
    };
  }

  /**
   * Fallback: Process contacts individually when batch insert fails
   * Used for error handling and reporting which specific contacts failed
   */
  private async bulkImportFallback(contacts: BulkImportContactInput[]): Promise<BulkImportResult> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const contact of contacts) {
      try {
        // Stringify metadata - PostgreSQL will infer JSONB type from column definition
        const metadataJson = JSON.stringify(contact.metadata || {});

        const result = await sql`
          INSERT INTO contacts (
            user_id,
            email,
            name,
            source,
            subscribed,
            metadata
          )
          VALUES (
            ${contact.userId},
            ${contact.email.toLowerCase().trim()},
            ${contact.name || null},
            ${contact.source},
            ${contact.subscribed},
            ${metadataJson}
          )
          ON CONFLICT (user_id, email) DO UPDATE SET
            name = EXCLUDED.name,
            subscribed = EXCLUDED.subscribed,
            source = EXCLUDED.source,
            metadata = contacts.metadata || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
          RETURNING (xmax = 0) AS inserted
        `;

        if (result.rows.length > 0 && result.rows[0].inserted) {
          inserted++;
        } else {
          updated++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[BulkImport] Error importing contact ${contact.email}:`, errorMessage);
        errors.push({
          email: contact.email,
          error: errorMessage
        });
        skipped++;
      }
    }

    return {
      inserted,
      updated,
      skipped,
      errors
    };
  }

  /**
   * Count total contacts for a user (used for quota checks)
   * @param userId - User identifier
   * @returns Total number of contacts for the user
   */
  async countByUserId(userId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM contacts
        WHERE user_id = ${userId}
      `;

      if (result.rows.length === 0) return 0;

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('PostgresContactRepository.countByUserId error:', error);
      throw new Error(
        `Failed to count contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get subscribed contacts filtered by list criteria
   * @param userId - User identifier
   * @param filterCriteria - List filter criteria (all contacts, specific lists, or exclude lists)
   * @returns Array of contacts matching the filter criteria
   */
  async getSubscribedByListFilter(
    userId: number,
    filterCriteria: ListFilterCriteria
  ): Promise<Contact[]> {
    // Case 1: All contacts (default behavior)
    if (filterCriteria.isAllContacts()) {
      return this.getSubscribed(userId);
    }

    // Case 2: Contacts in specific lists (UNION)
    if (filterCriteria.mode === LIST_FILTER_MODES.SPECIFIC_LISTS) {
      const listIdsArray = filterCriteria.listIds.map(id => `'${id}'`).join(',');
      const result = await sql`
        SELECT DISTINCT c.id, c.email, c.name, c.unsubscribe_token, c.subscribed, c.created_at
        FROM contacts c
        INNER JOIN contact_list_members clm ON c.id = clm.contact_id
        WHERE c.user_id = ${userId}
          AND c.subscribed = true
          AND clm.list_id = ANY(ARRAY[${listIdsArray}]::uuid[])
        ORDER BY c.created_at DESC
      `;

      return result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        unsubscribeToken: row.unsubscribe_token,
        subscribed: row.subscribed,
        createdAt: row.created_at
      }));
    }

    // Case 3: Contacts EXCLUDING specific lists
    if (filterCriteria.mode === LIST_FILTER_MODES.EXCLUDE_LISTS) {
      const listIdsArray = filterCriteria.listIds.map(id => `'${id}'`).join(',');
      const result = await sql`
        SELECT c.id, c.email, c.name, c.unsubscribe_token, c.subscribed, c.created_at
        FROM contacts c
        WHERE c.user_id = ${userId}
          AND c.subscribed = true
          AND NOT EXISTS (
            SELECT 1
            FROM contact_list_members clm
            WHERE clm.contact_id = c.id
              AND clm.list_id = ANY(ARRAY[${listIdsArray}]::uuid[])
          )
        ORDER BY c.created_at DESC
      `;

      return result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        unsubscribeToken: row.unsubscribe_token,
        subscribed: row.subscribed,
        createdAt: row.created_at
      }));
    }

    throw new Error(`Unsupported filter mode: ${filterCriteria.mode}`);
  }
}
