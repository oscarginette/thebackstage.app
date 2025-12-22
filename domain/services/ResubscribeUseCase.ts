/**
 * ResubscribeUseCase
 *
 * Business logic for re-subscribing a contact (Clean Architecture)
 * Handles consent tracking and audit logging (GDPR compliant)
 */

import { IContactRepository } from '../repositories/IContactRepository';
import { IConsentHistoryRepository } from '../repositories/IConsentHistoryRepository';
import { ConsentHistory } from '../entities/ConsentHistory';

export interface ResubscribeInput {
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ResubscribeResult {
  success: boolean;
  email: string;
  alreadySubscribed: boolean;
  error?: string;
}

export class ResubscribeUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private consentHistoryRepository: IConsentHistoryRepository
  ) {}

  async execute(input: ResubscribeInput): Promise<ResubscribeResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Find contact by token
    const contact = await this.contactRepository.findByUnsubscribeToken(input.token);

    if (!contact) {
      return {
        success: false,
        email: '',
        alreadySubscribed: false,
        error: 'Invalid token'
      };
    }

    // 3. Check if already subscribed
    const alreadySubscribed = contact.subscribed;

    // 4. If not already subscribed, update status
    if (!alreadySubscribed) {
      await this.contactRepository.resubscribe(contact.id);
    }

    // 5. Log consent change in audit trail
    const consentData = ConsentHistory.createResubscribe(
      contact.id,
      input.ipAddress,
      input.userAgent
    );

    await this.consentHistoryRepository.create({
      contactId: consentData.contactId,
      action: consentData.action,
      timestamp: consentData.timestamp,
      source: consentData.source,
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
      metadata: consentData.metadata
    });

    // 6. Return success result
    return {
      success: true,
      email: contact.email,
      alreadySubscribed,
      error: undefined
    };
  }

  /**
   * Validate resubscribe input
   */
  private validateInput(input: ResubscribeInput): void {
    if (!input.token || input.token.trim() === '') {
      throw new Error('Token is required');
    }

    // Token should be 64 characters (32 bytes hex encoded)
    if (input.token.length !== 64) {
      throw new Error('Invalid token format');
    }

    // Token should only contain hex characters
    if (!/^[a-f0-9]{64}$/i.test(input.token)) {
      throw new Error('Invalid token format');
    }
  }
}
