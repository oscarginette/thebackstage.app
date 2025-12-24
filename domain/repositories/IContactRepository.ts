export interface Contact {
  id: number;
  email: string;
  name?: string | null;
  unsubscribeToken: string;
  subscribed: boolean;
  createdAt: string;
  source?: string | null;
  unsubscribedAt?: string | null;
  metadata?: any;
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
  metadata: Record<string, any>;
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
}
