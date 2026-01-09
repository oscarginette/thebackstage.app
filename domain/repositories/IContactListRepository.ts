/**
 * IContactListRepository Interface
 *
 * Repository interface for ContactList entity.
 * Follows Dependency Inversion Principle (SOLID).
 */

import type { ContactList } from '../entities/ContactList';

/**
 * ContactList with aggregated statistics
 */
export interface ContactListWithStats {
  list: ContactList;
  totalContacts: number;
  subscribedContacts: number;
  lastContactAddedAt: Date | null;
}

/**
 * Input for creating a new contact list
 */
export interface CreateContactListInput {
  userId: number;
  name: string;
  description?: string | null;
  color: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating an existing contact list
 */
export interface UpdateContactListInput {
  name?: string;
  description?: string | null;
  color?: string;
}

/**
 * Repository interface for ContactList operations
 */
export interface IContactListRepository {
  /**
   * Create a new contact list
   */
  create(input: CreateContactListInput): Promise<ContactList>;

  /**
   * Find a contact list by ID (with user isolation)
   */
  findById(listId: string, userId: number): Promise<ContactList | null>;

  /**
   * Find all contact lists for a user
   */
  findByUserId(userId: number): Promise<ContactList[]>;

  /**
   * Find all contact lists with statistics for a user
   */
  findByUserIdWithStats(userId: number): Promise<ContactListWithStats[]>;

  /**
   * Count total lists for a user (for quota enforcement)
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * Update a contact list
   */
  update(
    listId: string,
    userId: number,
    input: UpdateContactListInput
  ): Promise<ContactList>;

  /**
   * Delete a contact list (cascade deletes members)
   */
  delete(listId: string, userId: number): Promise<void>;

  /**
   * Add contacts to a list (bulk operation)
   * Returns number of contacts successfully added
   */
  addContacts(
    listId: string,
    contactIds: number[],
    addedBy: number
  ): Promise<number>;

  /**
   * Remove contacts from a list (bulk operation)
   * Returns number of contacts successfully removed
   */
  removeContacts(listId: string, contactIds: number[]): Promise<number>;

  /**
   * Get all contact IDs in a list
   */
  getContactIds(listId: string, userId: number): Promise<number[]>;

  /**
   * Get all lists that contain a specific contact
   */
  getListsByContactId(contactId: number, userId: number): Promise<ContactList[]>;

  /**
   * Get all contacts in a list (full Contact objects)
   */
  getContactsByListId(listId: string, userId: number): Promise<import('../entities/Contact').Contact[]>;
}
