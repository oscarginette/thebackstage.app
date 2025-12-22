/**
 * UnsubscribeUseCase
 *
 * Business logic for unsubscribing a contact (Clean Architecture)
 * Handles consent tracking and audit logging (GDPR compliant)
 */

import { IContactRepository } from '../repositories/IContactRepository';
import { IConsentHistoryRepository } from '../repositories/IConsentHistoryRepository';
import { ConsentHistory } from '../entities/ConsentHistory';

export interface UnsubscribeInput {
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
}

export interface UnsubscribeResult {
  success: boolean;
  email: string;
  alreadyUnsubscribed: boolean;
  error?: string;
}

export class UnsubscribeUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private consentHistoryRepository: IConsentHistoryRepository
  ) {}

  async execute(input: UnsubscribeInput): Promise<UnsubscribeResult> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Find contact by token
    const contact = await this.contactRepository.findByUnsubscribeToken(input.token);

    if (!contact) {
      return {
        success: false,
        email: '',
        alreadyUnsubscribed: false,
        error: 'Invalid unsubscribe token'
      };
    }

    // 3. Check if already unsubscribed
    const alreadyUnsubscribed = !contact.subscribed;

    // 4. If not already unsubscribed, update status
    if (!alreadyUnsubscribed) {
      await this.contactRepository.unsubscribe(contact.id);
    }

    // 5. Log consent change in audit trail (even if already unsubscribed)
    const consentData = ConsentHistory.createUnsubscribe(
      contact.id,
      input.ipAddress,
      input.userAgent,
      input.reason
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
      alreadyUnsubscribed,
      error: undefined
    };
  }

  /**
   * Validate unsubscribe input
   */
  private validateInput(input: UnsubscribeInput): void {
    if (!input.token || input.token.trim() === '') {
      throw new Error('Unsubscribe token is required');
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
