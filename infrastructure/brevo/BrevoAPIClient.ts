/**
 * BrevoAPIClient Implementation
 *
 * Concrete implementation of IBrevoAPIClient using the official Brevo SDK.
 * Handles API communication, pagination, deduplication, and rate limiting.
 *
 * Infrastructure Layer:
 * - Depends on external SDK (@getbrevo/brevo)
 * - Implements domain interface (IBrevoAPIClient)
 * - Domain layer has NO knowledge of this concrete implementation
 */

import * as brevo from '@getbrevo/brevo';
import {
  IBrevoAPIClient,
  BrevoList,
  BrevoContact
} from '@/domain/repositories/IBrevoAPIClient';

export class BrevoAPIClient implements IBrevoAPIClient {
  private contactsApi: brevo.ContactsApi;

  constructor(apiKey: string) {
    this.contactsApi = new brevo.ContactsApi();
    this.contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);
  }

  /**
   * Fetch all available contact lists from Brevo
   */
  async getLists(): Promise<BrevoList[]> {
    try {
      const response = await this.contactsApi.getLists();
      const lists = response.body.lists || [];

      return lists.map(list => ({
        id: list.id,
        name: list.name,
        totalSubscribers: list.totalSubscribers
      }));
    } catch (error: unknown) {
      throw this.handleBrevoError(error, 'Failed to fetch lists');
    }
  }

  /**
   * Fetch contacts from all lists
   *
   * Features:
   * - Pagination handling (500 contacts per request)
   * - Deduplication (same contact can be in multiple lists)
   * - Rate limiting (100ms delay between requests)
   * - List ID merging for duplicates
   */
  async getContactsFromAllLists(options?: {
    limit?: number;
  }): Promise<BrevoContact[]> {
    const { limit } = options || {};

    try {
      // 1. Fetch all lists
      const lists = await this.getLists();

      // 2. Deduplicate contacts by email (Map for O(1) lookup)
      const contactsMap = new Map<string, BrevoContact>();
      let totalFetched = 0;

      // 3. Process each list
      for (const list of lists) {
        // Check if we've hit the preview limit
        if (limit && totalFetched >= limit) {
          break;
        }

        // Fetch contacts from this list with pagination
        const listContacts = await this.fetchContactsFromList(
          list.id,
          limit ? limit - totalFetched : undefined
        );

        // Merge contacts into map (deduplicate + merge list IDs)
        for (const contact of listContacts) {
          const email = contact.email.toLowerCase();

          if (contactsMap.has(email)) {
            // Contact exists: Merge list IDs
            const existing = contactsMap.get(email)!;
            existing.listIds = [...new Set([...existing.listIds, ...contact.listIds])];
          } else {
            // New contact: Add to map
            contactsMap.set(email, contact);
            totalFetched++;

            // Stop if we hit the limit
            if (limit && totalFetched >= limit) {
              break;
            }
          }
        }
      }

      // 4. Return unique contacts as array
      return Array.from(contactsMap.values());

    } catch (error: unknown) {
      throw this.handleBrevoError(error, 'Failed to fetch contacts');
    }
  }

  /**
   * Fetch contacts from a single list with pagination
   * Internal helper method
   */
  private async fetchContactsFromList(
    listId: number,
    limit?: number
  ): Promise<BrevoContact[]> {
    const contacts: BrevoContact[] = [];
    let offset = 0;
    const pageSize = 500; // Brevo's maximum per request
    let hasMore = true;

    while (hasMore) {
      // Check if we've fetched enough
      if (limit && contacts.length >= limit) {
        break;
      }

      // Fetch page of contacts
      const response = await this.contactsApi.getContactsFromList(
        listId,
        undefined, // modifiedSince
        pageSize,
        offset,
        undefined // sort
      );

      const page = response.body.contacts || [];

      // Transform to our BrevoContact format
      for (const contact of page) {
        // Skip contacts without email (invalid data)
        if (!contact.email) continue;

        contacts.push({
          id: contact.id,
          email: contact.email,
          emailBlacklisted: contact.emailBlacklisted || false,
          listIds: contact.listIds || [listId],
          attributes: (contact.attributes as Record<string, any>) || {}
        });

        // Stop if we hit the limit
        if (limit && contacts.length >= limit) {
          break;
        }
      }

      // Check if there are more pages
      if (page.length < pageSize) {
        hasMore = false; // Last page
      } else {
        offset += pageSize;

        // Rate limiting: 100ms delay between requests
        await this.sleep(100);
      }
    }

    return contacts;
  }

  /**
   * Handle Brevo API errors and convert to user-friendly messages
   */
  private handleBrevoError(error: unknown, defaultMessage: string): Error {
    // Type guard for objects with status/statusCode properties
    const hasStatus = (err: unknown): err is { status?: number; statusCode?: number; message?: string } => {
      return typeof err === 'object' && err !== null;
    };

    if (hasStatus(error)) {
      if (error.status === 401 || error.statusCode === 401) {
        return new Error('Invalid API key. Please check your Brevo API key in Settings.');
      }

      if (error.status === 429 || error.statusCode === 429) {
        return new Error('Brevo API rate limit exceeded. Please try again in a few minutes.');
      }

      if (error.status === 404 || error.statusCode === 404) {
        return new Error('Resource not found in Brevo. The list may have been deleted.');
      }
    }

    // Generic error with original message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`${defaultMessage}: ${errorMessage}`);
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
