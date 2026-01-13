/**
 * ConsentHistory Entity
 *
 * Domain entity representing a consent change event (GDPR compliance)
 */

import type { ConsentHistoryMetadata } from '../types/metadata';

export type ConsentAction =
  | 'subscribe'
  | 'unsubscribe'
  | 'resubscribe'
  | 'delete_request'
  | 'bounce'
  | 'spam_complaint';

/**
 * Consent Action Constants
 * Use these constants instead of string literals for type safety
 */
export const CONSENT_ACTIONS = {
  SUBSCRIBE: 'subscribe' as const,
  UNSUBSCRIBE: 'unsubscribe' as const,
  RESUBSCRIBE: 'resubscribe' as const,
  DELETE_REQUEST: 'delete_request' as const,
  BOUNCE: 'bounce' as const,
  SPAM_COMPLAINT: 'spam_complaint' as const,
} as const;

export type ConsentSource =
  | 'email_link'
  | 'api_request'
  | 'admin_action'
  | 'webhook_bounce'
  | 'hypedit_signup'
  | 'manual_import'
  | 'download_gate';

/**
 * Consent Source Constants
 * Use these constants instead of string literals for type safety
 */
export const CONSENT_SOURCES = {
  EMAIL_LINK: 'email_link' as const,
  API_REQUEST: 'api_request' as const,
  ADMIN_ACTION: 'admin_action' as const,
  WEBHOOK_BOUNCE: 'webhook_bounce' as const,
  HYPEDIT_SIGNUP: 'hypedit_signup' as const,
  MANUAL_IMPORT: 'manual_import' as const,
  DOWNLOAD_GATE: 'download_gate' as const,
} as const;

// Re-export for backward compatibility
export type ConsentMetadata = ConsentHistoryMetadata;

export class ConsentHistory {
  constructor(
    public readonly id: number,
    public readonly contactId: number,
    public readonly action: ConsentAction,
    public readonly timestamp: Date,
    public readonly source: ConsentSource,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly metadata: ConsentMetadata | null,
    public readonly createdAt: Date
  ) {
    // Validate action
    const validActions: ConsentAction[] = [
      'subscribe',
      'unsubscribe',
      'resubscribe',
      'delete_request',
      'bounce',
      'spam_complaint'
    ];

    if (!validActions.includes(action)) {
      throw new Error(`Invalid consent action: ${action}`);
    }

    // Validate source
    const validSources: ConsentSource[] = [
      'email_link',
      'api_request',
      'admin_action',
      'webhook_bounce',
      'hypedit_signup',
      'manual_import',
      'download_gate'
    ];

    if (!validSources.includes(source)) {
      throw new Error(`Invalid consent source: ${source}`);
    }
  }

  /**
   * Factory method to create consent history from user unsubscribe
   */
  static createUnsubscribe(
    contactId: number,
    ipAddress: string | null,
    userAgent: string | null,
    reason?: string
  ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'> {
    return {
      contactId,
      action: CONSENT_ACTIONS.UNSUBSCRIBE,
      timestamp: new Date(),
      source: CONSENT_SOURCES.EMAIL_LINK,
      ipAddress,
      userAgent,
      metadata: reason ? { reason } : null
    };
  }

  /**
   * Factory method to create consent history from resubscribe
   */
  static createResubscribe(
    contactId: number,
    ipAddress: string | null,
    userAgent: string | null
  ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'> {
    return {
      contactId,
      action: CONSENT_ACTIONS.RESUBSCRIBE,
      timestamp: new Date(),
      source: CONSENT_SOURCES.EMAIL_LINK,
      ipAddress,
      userAgent,
      metadata: null
    };
  }

  /**
   * Factory method to create consent history from bounce
   */
  static createBounce(
    contactId: number,
    bounceType: 'hard' | 'soft',
    reason: string
  ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'> {
    return {
      contactId,
      action: CONSENT_ACTIONS.BOUNCE,
      timestamp: new Date(),
      source: CONSENT_SOURCES.WEBHOOK_BOUNCE,
      ipAddress: null,
      userAgent: null,
      metadata: { bounce_type: bounceType, reason }
    };
  }

  /**
   * Check if this is an unsubscribe action
   */
  isUnsubscribe(): boolean {
    return this.action === CONSENT_ACTIONS.UNSUBSCRIBE;
  }

  /**
   * Check if this is a resubscribe action
   */
  isResubscribe(): boolean {
    return this.action === CONSENT_ACTIONS.RESUBSCRIBE;
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    const actionDescriptions: Record<ConsentAction, string> = {
      [CONSENT_ACTIONS.SUBSCRIBE]: 'Subscribed to mailing list',
      [CONSENT_ACTIONS.UNSUBSCRIBE]: 'Unsubscribed from mailing list',
      [CONSENT_ACTIONS.RESUBSCRIBE]: 'Re-subscribed to mailing list',
      [CONSENT_ACTIONS.DELETE_REQUEST]: 'Requested data deletion (GDPR)',
      [CONSENT_ACTIONS.BOUNCE]: 'Email bounced',
      [CONSENT_ACTIONS.SPAM_COMPLAINT]: 'Marked email as spam'
    };

    return actionDescriptions[this.action];
  }
}
