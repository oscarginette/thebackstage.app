import { sql } from '@/lib/db';
import { IContactRepository, Contact, ContactStats } from '@/domain/repositories/IContactRepository';

export class PostgresContactRepository implements IContactRepository {
  async getSubscribed(): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE subscribed = true
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at
    }));
  }

  async findByEmail(email: string): Promise<Contact | null> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE email = ${email}
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
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
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
      createdAt: row.created_at
    };
  }

  async updateSubscriptionStatus(id: number, subscribed: boolean): Promise<void> {
    await sql`
      UPDATE contacts
      SET subscribed = ${subscribed}
      WHERE id = ${id}
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

  async resubscribe(id: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET
        subscribed = true,
        unsubscribed_at = NULL
      WHERE id = ${id}
    `;
  }

  async findAll(): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at, source, unsubscribed_at, metadata
      FROM contacts
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
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

  async getStats(): Promise<ContactStats> {
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

  async delete(ids: number[]): Promise<number> {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await sql.query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids
    );

    return result.rowCount || 0;
  }
}
