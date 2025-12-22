import { sql } from '@/lib/db';
import { IContactRepository, Contact } from '@/domain/repositories/IContactRepository';

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
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
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
}
