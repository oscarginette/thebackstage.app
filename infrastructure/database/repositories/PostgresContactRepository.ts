import { sql } from '@/lib/db';
import {
  IContactRepository,
  Contact,
  ContactStats,
  BulkImportContactInput,
  BulkImportResult
} from '@/domain/repositories/IContactRepository';

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
      metadata: row.metadata
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
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Process each contact individually to handle errors gracefully
    for (const contact of contacts) {
      try {
        // Insert or update contact with ON CONFLICT
        // Override all fields including subscription status (per user requirement)
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
            ${contact.name},
            ${contact.source},
            ${contact.subscribed},
            ${JSON.stringify(contact.metadata)}::jsonb
          )
          ON CONFLICT (user_id, email) DO UPDATE SET
            name = EXCLUDED.name,
            subscribed = EXCLUDED.subscribed,
            source = EXCLUDED.source,
            metadata = contacts.metadata || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
          RETURNING (xmax = 0) AS inserted
        `;

        // Check if it was an insert or update
        // xmax = 0 means INSERT, xmax > 0 means UPDATE
        if (result.rows[0].inserted) {
          inserted++;
        } else {
          updated++;
        }
      } catch (error: any) {
        console.error(`Error importing contact ${contact.email}:`, error.message);
        errors.push({
          email: contact.email,
          error: error.message || 'Unknown error'
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

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('PostgresContactRepository.countByUserId error:', error);
      throw new Error(
        `Failed to count contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
