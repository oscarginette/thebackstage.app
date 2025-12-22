export interface Contact {
  id: number;
  email: string;
  name?: string | null;
  unsubscribeToken: string;
  subscribed: boolean;
  createdAt: string;
}

export interface IContactRepository {
  getSubscribed(): Promise<Contact[]>;
  findByEmail(email: string): Promise<Contact | null>;
  findByUnsubscribeToken(token: string): Promise<Contact | null>;
  updateSubscriptionStatus(id: number, subscribed: boolean): Promise<void>;
  unsubscribe(id: number): Promise<void>;
  resubscribe(id: number): Promise<void>;
  findAll(): Promise<Contact[]>;
}
