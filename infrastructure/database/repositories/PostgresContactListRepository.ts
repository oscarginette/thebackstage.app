/**
 * PostgresContactListRepository
 *
 * PostgreSQL implementation of IContactListRepository.
 * Follows Dependency Inversion Principle (SOLID).
 */

import { sql } from '@vercel/postgres';
import type {
  IContactListRepository,
  ContactListWithStats,
  CreateContactListInput,
  UpdateContactListInput,
} from '@/domain/repositories/IContactListRepository';
import { ContactList } from '@/domain/entities/ContactList';
import { Contact } from '@/domain/entities/Contact';

export class PostgresContactListRepository implements IContactListRepository {
  /**
   * Create a new contact list
   */
  async create(input: CreateContactListInput): Promise<ContactList> {
    const result = await sql`
      INSERT INTO contact_lists (user_id, name, description, color, metadata)
      VALUES (
        ${input.userId},
        ${input.name},
        ${input.description || null},
        ${input.color},
        ${JSON.stringify(input.metadata || {})}
      )
      RETURNING id, user_id, name, description, color, created_at, updated_at, metadata
    `;

    return ContactList.fromDatabase(result.rows[0]);
  }

  /**
   * Find contact list by ID with user isolation
   */
  async findById(listId: string, userId: number): Promise<ContactList | null> {
    const result = await sql`
      SELECT id, user_id, name, description, color, created_at, updated_at, metadata
      FROM contact_lists
      WHERE id = ${listId} AND user_id = ${userId}
    `;

    if (result.rows.length === 0) return null;

    return ContactList.fromDatabase(result.rows[0]);
  }

  /**
   * Find all contact lists for a user (alphabetically sorted)
   */
  async findByUserId(userId: number): Promise<ContactList[]> {
    const result = await sql`
      SELECT id, user_id, name, description, color, created_at, updated_at, metadata
      FROM contact_lists
      WHERE user_id = ${userId}
      ORDER BY LOWER(name) ASC
    `;

    return result.rows.map((row) => ContactList.fromDatabase(row));
  }

  /**
   * Find all contact lists with aggregated statistics
   */
  async findByUserIdWithStats(
    userId: number
  ): Promise<ContactListWithStats[]> {
    const result = await sql`
      SELECT
        cl.id, cl.user_id, cl.name, cl.description, cl.color,
        cl.created_at, cl.updated_at, cl.metadata,
        COALESCE(COUNT(clm.contact_id), 0) AS total_contacts,
        COALESCE(
          COUNT(clm.contact_id) FILTER (WHERE c.subscribed = true),
          0
        ) AS subscribed_contacts,
        MAX(clm.added_at) AS last_contact_added_at
      FROM contact_lists cl
      LEFT JOIN contact_list_members clm ON cl.id = clm.list_id
      LEFT JOIN contacts c ON clm.contact_id = c.id
      WHERE cl.user_id = ${userId}
      GROUP BY cl.id
      ORDER BY LOWER(cl.name) ASC
    `;

    return result.rows.map((row) => ({
      list: ContactList.fromDatabase(row),
      totalContacts: Number(row.total_contacts),
      subscribedContacts: Number(row.subscribed_contacts),
      lastContactAddedAt: row.last_contact_added_at
        ? new Date(row.last_contact_added_at)
        : null,
    }));
  }

  /**
   * Count total lists for a user (for quota enforcement)
   */
  async countByUserId(userId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM contact_lists
      WHERE user_id = ${userId}
    `;

    return Number(result.rows[0].count);
  }

  /**
   * Update contact list properties
   */
  async update(
    listId: string,
    userId: number,
    input: UpdateContactListInput
  ): Promise<ContactList> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(input.name);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(input.description);
    }

    if (input.color !== undefined) {
      updates.push(`color = $${values.length + 1}`);
      values.push(input.color);
    }

    if (updates.length === 0) {
      const existing = await this.findById(listId, userId);
      if (!existing) throw new Error('List not found');
      return existing;
    }

    values.push(listId, userId);

    const result = await sql.query(
      `UPDATE contact_lists
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id, user_id, name, description, color, created_at, updated_at, metadata`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('List not found or access denied');
    }

    return ContactList.fromDatabase(result.rows[0]);
  }

  /**
   * Delete contact list (cascade deletes members automatically)
   */
  async delete(listId: string, userId: number): Promise<void> {
    const result = await sql`
      DELETE FROM contact_lists
      WHERE id = ${listId} AND user_id = ${userId}
    `;

    if (result.rowCount === 0) {
      throw new Error('List not found or access denied');
    }
  }

  /**
   * Add contacts to list (bulk operation with parallel processing)
   * Returns number of contacts successfully added (duplicates are skipped)
   */
  async addContacts(
    listId: string,
    contactIds: number[],
    addedBy: number
  ): Promise<number> {
    if (contactIds.length === 0) return 0;

    // Parallel inserts (follows pattern from PostgresContactRepository)
    const results = await Promise.all(
      contactIds.map(async (contactId) => {
        try {
          await sql`
            INSERT INTO contact_list_members (list_id, contact_id, added_by)
            VALUES (${listId}, ${contactId}, ${addedBy})
            ON CONFLICT (list_id, contact_id) DO NOTHING
          `;
          return { success: true };
        } catch (error) {
          return { success: false };
        }
      })
    );

    return results.filter((r) => r.success).length;
  }

  /**
   * Remove contacts from list (bulk operation)
   * Returns number of contacts successfully removed
   */
  async removeContacts(listId: string, contactIds: number[]): Promise<number> {
    if (contactIds.length === 0) return 0;

    const result = await sql`
      DELETE FROM contact_list_members
      WHERE list_id = ${listId} AND contact_id = ANY(ARRAY[${contactIds.join(',')}]::integer[])
    `;

    return result.rowCount || 0;
  }

  /**
   * Get all contact IDs in a list
   */
  async getContactIds(listId: string, userId: number): Promise<number[]> {
    // Validate that the list belongs to the user
    const list = await this.findById(listId, userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    const result = await sql`
      SELECT contact_id
      FROM contact_list_members
      WHERE list_id = ${listId}
      ORDER BY added_at DESC
    `;

    return result.rows.map((row) => row.contact_id);
  }

  /**
   * Get all lists that contain a specific contact
   */
  async getListsByContactId(
    contactId: number,
    userId: number
  ): Promise<ContactList[]> {
    const result = await sql`
      SELECT cl.id, cl.user_id, cl.name, cl.description, cl.color,
             cl.created_at, cl.updated_at, cl.metadata
      FROM contact_lists cl
      INNER JOIN contact_list_members clm ON cl.id = clm.list_id
      WHERE clm.contact_id = ${contactId} AND cl.user_id = ${userId}
      ORDER BY LOWER(cl.name) ASC
    `;

    return result.rows.map((row) => ContactList.fromDatabase(row));
  }

  /**
   * Get all contacts in a list (full Contact objects)
   */
  async getContactsByListId(
    listId: string,
    userId: number
  ): Promise<Contact[]> {
    // Validate that the list belongs to the user
    const list = await this.findById(listId, userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    const result = await sql`
      SELECT c.id, c.email, c.unsubscribe_token, c.subscribed, c.name, c.created_at
      FROM contacts c
      INNER JOIN contact_list_members clm ON c.id = clm.contact_id
      WHERE clm.list_id = ${listId} AND c.user_id = ${userId}
      ORDER BY clm.added_at DESC
    `;

    return result.rows.map((row) =>
      Contact.create({
        id: row.id,
        email: row.email,
        unsubscribeToken: row.unsubscribe_token,
        subscribed: row.subscribed,
        name: row.name,
        createdAt: row.created_at,
      })
    );
  }
}
