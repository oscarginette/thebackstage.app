/**
 * ConsentHistory Entity
 *
 * Domain entity representing a consent change event (GDPR compliance)
 */

export type ConsentAction =
  | 'subscribe'
  | 'unsubscribe'
  | 'resubscribe'
  | 'delete_request'
  | 'bounce'
  | 'spam_complaint';

export type ConsentSource =
  | 'email_link'
  | 'api_request'
  | 'admin_action'
  | 'webhook_bounce'
  | 'hypedit_signup'
  | 'manual_import';

export interface ConsentMetadata {
  reason?: string;
  campaign_id?: string;
  track_id?: string;
  [key: string]: any;
}

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
      'manual_import'
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
      action: 'unsubscribe',
      timestamp: new Date(),
      source: 'email_link',
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
      action: 'resubscribe',
      timestamp: new Date(),
      source: 'email_link',
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
      action: 'bounce',
      timestamp: new Date(),
      source: 'webhook_bounce',
      ipAddress: null,
      userAgent: null,
      metadata: { bounce_type: bounceType, reason }
    };
  }

  /**
   * Check if this is an unsubscribe action
   */
  isUnsubscribe(): boolean {
    return this.action === 'unsubscribe';
  }

  /**
   * Check if this is a resubscribe action
   */
  isResubscribe(): boolean {
    return this.action === 'resubscribe';
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    const actionDescriptions: Record<ConsentAction, string> = {
      subscribe: 'Subscribed to mailing list',
      unsubscribe: 'Unsubscribed from mailing list',
      resubscribe: 'Re-subscribed to mailing list',
      delete_request: 'Requested data deletion (GDPR)',
      bounce: 'Email bounced',
      spam_complaint: 'Marked email as spam'
    };

    return actionDescriptions[this.action];
  }
}
