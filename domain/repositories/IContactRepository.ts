import type { ContactMetadata } from '../types/metadata';
import type { ListFilterCriteria } from '../value-objects/ListFilterCriteria';

export interface Contact {
  id: number;
  email: string;
  name?: string | null;
  unsubscribeToken: string;
  subscribed: boolean;
  createdAt: string;
  source?: string | null;
  unsubscribedAt?: string | null;
  metadata?: ContactMetadata;
  userId?: number;
}

export interface ContactStats {
  totalContacts: number;
  activeSubscribers: number;
  unsubscribed: number;
  fromHypeddit: number;
  fromHypedit: number;
  newLast30Days: number;
  newLast7Days: number;
}

export interface BulkImportContactInput {
  userId: number;
  email: string;
  name: string | null;
  subscribed: boolean;
  source: string;
  metadata: ContactMetadata;
  createdAt?: Date | null;
}

export interface BulkImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}

export interface IContactRepository {
  getSubscribed(userId: number): Promise<Contact[]>;
  findByEmail(email: string, userId: number): Promise<Contact | null>;
  findByUnsubscribeToken(token: string): Promise<Contact | null>;
  updateSubscriptionStatus(id: number, subscribed: boolean, userId: number): Promise<void>;
  unsubscribe(id: number): Promise<void>;
  resubscribe(id: number, userId: number): Promise<void>;
  findAll(userId: number): Promise<Contact[]>;
  getStats(userId: number): Promise<ContactStats>;
  delete(ids: number[], userId: number): Promise<number>;
  bulkImport(contacts: BulkImportContactInput[]): Promise<BulkImportResult>;

  /**
   * Count total contacts for a user (used for quota checks)
   * @param userId - User identifier
   * @returns Total number of contacts for the user
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * Get subscribed contacts filtered by list criteria
   * @param userId - User identifier
   * @param filterCriteria - List filter criteria (all contacts, specific lists, or exclude lists)
   * @returns Array of contacts matching the filter criteria
   */
  getSubscribedByListFilter(
    userId: number,
    filterCriteria: ListFilterCriteria
  ): Promise<Contact[]>;

  /**
   * Get subscribed contacts who haven't received a specific campaign yet
   * Used by warm-up batch sending to select next batch of recipients
   *
   * @param userId - User identifier
   * @param campaignId - Campaign identifier
   * @param limit - Maximum number of contacts to return
   * @returns Array of contacts who haven't been sent this campaign (ordered by created_at ASC)
   */
  getUnsentForCampaign(
    userId: number,
    campaignId: string,
    limit: number
  ): Promise<Contact[]>;
}
