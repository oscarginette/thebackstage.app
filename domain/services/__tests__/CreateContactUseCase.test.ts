import { CreateContactUseCase } from '../CreateContactUseCase';
import { CONSENT_ACTIONS, CONSENT_SOURCES } from '@/domain/entities/ConsentHistory';
import type { IContactRepository, Contact, BulkImportResult } from '@/domain/repositories/IContactRepository';
import type { IConsentHistoryRepository, CreateConsentHistoryInput } from '@/domain/repositories/IConsentHistoryRepository';
import type { ConsentHistory } from '@/domain/entities/ConsentHistory';

/**
 * Mock ContactRepository
 * Implements IContactRepository for testing
 */
class MockContactRepository implements IContactRepository {
  private contacts: Contact[] = [];

  async findByEmail(email: string, userId: number): Promise<Contact | null> {
    return this.contacts.find(c => c.email === email && c.userId === userId) || null;
  }

  async bulkImport(contacts: any[]): Promise<BulkImportResult> {
    const newContacts = contacts.map((c, idx) => ({
      id: this.contacts.length + idx + 1,
      email: c.email,
      name: c.name,
      subscribed: c.subscribed,
      unsubscribeToken: 'mock-token',
      createdAt: new Date().toISOString(),
      source: c.source,
      metadata: c.metadata,
      userId: c.userId
    }));

    this.contacts.push(...newContacts);

    return {
      inserted: newContacts.length,
      updated: 0,
      skipped: 0,
      errors: []
    };
  }

  async resubscribe(id: number, userId: number): Promise<void> {
    const contact = this.contacts.find(c => c.id === id && c.userId === userId);
    if (contact) {
      contact.subscribed = true;
    }
  }

  // Stub methods (not used in tests)
  async getSubscribed(userId: number): Promise<Contact[]> {
    return this.contacts.filter(c => c.userId === userId && c.subscribed);
  }
  async findByUnsubscribeToken(token: string): Promise<Contact | null> {
    return null;
  }
  async updateSubscriptionStatus(id: number, subscribed: boolean, userId: number): Promise<void> {}
  async unsubscribe(id: number): Promise<void> {}
  async findAll(userId: number): Promise<Contact[]> {
    return this.contacts.filter(c => c.userId === userId);
  }
  async getStats(userId: number): Promise<any> {
    return {};
  }
  async delete(ids: number[], userId: number): Promise<number> {
    return 0;
  }
  async countByUserId(userId: number): Promise<number> {
    return this.contacts.filter(c => c.userId === userId).length;
  }
  async getSubscribedByListFilter(userId: number, filterCriteria: any): Promise<Contact[]> {
    return [];
  }
}

/**
 * Mock ConsentHistoryRepository
 * Implements IConsentHistoryRepository for testing
 */
class MockConsentHistoryRepository implements IConsentHistoryRepository {
  public logs: CreateConsentHistoryInput[] = [];

  async create(input: CreateConsentHistoryInput): Promise<ConsentHistory> {
    this.logs.push(input);

    return {
      id: this.logs.length,
      contactId: input.contactId,
      action: input.action,
      timestamp: input.timestamp,
      source: input.source,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata || null,
      createdAt: new Date()
    } as ConsentHistory;
  }

  // Stub methods (not used in tests)
  async findByContactId(contactId: number): Promise<ConsentHistory[]> {
    return [];
  }
  async findByAction(action: any, limit?: number): Promise<ConsentHistory[]> {
    return [];
  }
  async getRecentUnsubscribes(days: number): Promise<ConsentHistory[]> {
    return [];
  }
  async getContactTimeline(contactId: number): Promise<ConsentHistory[]> {
    return [];
  }
  async countByAction(action: any, startDate?: Date, endDate?: Date): Promise<number> {
    return 0;
  }
}

describe('CreateContactUseCase', () => {
  let mockContactRepo: MockContactRepository;
  let mockConsentRepo: MockConsentHistoryRepository;
  let useCase: CreateContactUseCase;

  beforeEach(() => {
    mockContactRepo = new MockContactRepository();
    mockConsentRepo = new MockConsentHistoryRepository();
    useCase = new CreateContactUseCase(mockContactRepo, mockConsentRepo);
  });

  describe('Creating new contacts', () => {
    it('should create a new contact successfully', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscribed: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result.success).toBe(true);
      expect(result.contact).toBeDefined();
      expect(result.contact?.email).toBe('test@example.com');
      expect(result.contact?.name).toBe('Test User');
      expect(result.contact?.subscribed).toBe(true);
      expect(result.action).toBe('created');
    });

    it('should create contact with only email (name optional)', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'minimal@example.com',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(true);
      expect(result.contact?.email).toBe('minimal@example.com');
      expect(result.contact?.name).toBeNull();
    });

    it('should default subscribed to true if not provided', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'default@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.contact?.subscribed).toBe(true);
    });

    it('should create unsubscribed contact if subscribed is false', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'unsubscribed@example.com',
        subscribed: false
      });

      expect(result.success).toBe(true);
      expect(result.contact?.subscribed).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should reject invalid email format', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'invalid-email',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid email');
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);

      const result = await useCase.execute({
        userId: 1,
        email: 'test@example.com',
        name: longName,
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('100 characters');
    });
  });

  describe('Duplicate detection', () => {
    beforeEach(async () => {
      // Pre-populate with existing contact
      await mockContactRepo.bulkImport([{
        userId: 1,
        email: 'existing@example.com',
        name: 'Existing User',
        subscribed: true,
        source: 'manual_add',
        metadata: {}
      }]);
    });

    it('should reject duplicate email if contact is subscribed', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'existing@example.com',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contact already exists and is subscribed');
    });

    it('should resubscribe if contact exists but is unsubscribed', async () => {
      // Create unsubscribed contact
      await mockContactRepo.bulkImport([{
        userId: 1,
        email: 'unsubscribed@example.com',
        name: 'Unsubscribed User',
        subscribed: false,
        source: 'manual_add',
        metadata: {}
      }]);

      const result = await useCase.execute({
        userId: 1,
        email: 'unsubscribed@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('resubscribed');
      expect(result.contact?.subscribed).toBe(true);
    });
  });

  describe('GDPR consent logging', () => {
    it('should log consent history on create', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'new@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(result.success).toBe(true);
      expect(mockConsentRepo.logs).toHaveLength(1);

      const log = mockConsentRepo.logs[0];
      expect(log.action).toBe(CONSENT_ACTIONS.SUBSCRIBE);
      expect(log.source).toBe(CONSENT_SOURCES.MANUAL_IMPORT);
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
      expect(log.metadata).toEqual({
        channel: 'api',
        notes: 'Contact added manually via web form'
      });
    });

    it('should log consent history on resubscribe', async () => {
      // Create unsubscribed contact
      await mockContactRepo.bulkImport([{
        userId: 1,
        email: 'resubscribe@example.com',
        name: 'User',
        subscribed: false,
        source: 'manual_add',
        metadata: {}
      }]);

      const result = await useCase.execute({
        userId: 1,
        email: 'resubscribe@example.com',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome'
      });

      expect(result.success).toBe(true);
      expect(mockConsentRepo.logs).toHaveLength(1);

      const log = mockConsentRepo.logs[0];
      expect(log.action).toBe(CONSENT_ACTIONS.RESUBSCRIBE);
      expect(log.source).toBe(CONSENT_SOURCES.MANUAL_IMPORT);
      expect(log.ipAddress).toBe('10.0.0.1');
      expect(log.userAgent).toBe('Chrome');
    });

    it('should handle missing IP address and user agent', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'no-tracking@example.com'
      });

      expect(result.success).toBe(true);
      expect(mockConsentRepo.logs).toHaveLength(1);

      const log = mockConsentRepo.logs[0];
      expect(log.ipAddress).toBeNull();
      expect(log.userAgent).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: '',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Metadata', () => {
    it('should store custom metadata', async () => {
      const result = await useCase.execute({
        userId: 1,
        email: 'meta@example.com',
        metadata: {
          source: 'landing_page',
          campaign: 'summer_2024'
        }
      });

      expect(result.success).toBe(true);
      expect(result.contact?.metadata).toEqual({
        source: 'landing_page',
        campaign: 'summer_2024'
      });
    });
  });
});
