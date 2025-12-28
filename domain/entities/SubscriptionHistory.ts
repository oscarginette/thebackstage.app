/**
 * SubscriptionHistory Entity
 *
 * Domain entity representing subscription change audit trail (GDPR compliance).
 * Immutable - once created, records cannot be modified.
 *
 * GDPR Article 30: Records of processing activities must be maintained.
 * This entity tracks all subscription and quota changes with IP/timestamp for legal defense.
 *
 * Clean Architecture: Domain entity with no external dependencies.
 * SOLID: Single Responsibility - Subscription change audit only.
 */

export type SubscriptionChangeType =
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'quota_increase'
  | 'quota_decrease'
  | 'cancellation'
  | 'reactivation'
  | 'trial_started'
  | 'trial_expired';

export interface QuotaData {
  max_contacts?: number;
  max_monthly_emails?: number | null;
  [key: string]: any;
}

export interface SubscriptionHistoryProps {
  id: number;
  userId: number;
  changeType: SubscriptionChangeType;
  oldPlan: string | null;
  newPlan: string | null;
  oldQuota: QuotaData | null;
  newQuota: QuotaData | null;
  changedByUserId: number | null;
  changeReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class SubscriptionHistory {
  private constructor(private readonly props: SubscriptionHistoryProps) {
    this.validate();
    Object.freeze(this); // Immutable entity
  }

  private validate(): void {
    // Change type validation
    const validChangeTypes: SubscriptionChangeType[] = [
      'plan_upgrade',
      'plan_downgrade',
      'quota_increase',
      'quota_decrease',
      'cancellation',
      'reactivation',
      'trial_started',
      'trial_expired'
    ];

    if (!validChangeTypes.includes(this.props.changeType)) {
      throw new Error(`Invalid change type: ${this.props.changeType}`);
    }

    // User ID validation
    if (!this.props.userId || this.props.userId <= 0) {
      throw new Error('Invalid userId: must be greater than 0');
    }

    // Plan change validation
    if (
      (this.props.changeType === 'plan_upgrade' || this.props.changeType === 'plan_downgrade') &&
      (!this.props.oldPlan || !this.props.newPlan)
    ) {
      throw new Error('Plan changes require both oldPlan and newPlan');
    }

    // Quota change validation
    if (
      (this.props.changeType === 'quota_increase' || this.props.changeType === 'quota_decrease') &&
      (!this.props.oldQuota || !this.props.newQuota)
    ) {
      throw new Error('Quota changes require both oldQuota and newQuota');
    }
  }

  // Getters (read-only)

  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get changeType(): SubscriptionChangeType {
    return this.props.changeType;
  }

  get oldPlan(): string | null {
    return this.props.oldPlan;
  }

  get newPlan(): string | null {
    return this.props.newPlan;
  }

  get oldQuota(): QuotaData | null {
    return this.props.oldQuota ? { ...this.props.oldQuota } : null; // Return copy
  }

  get newQuota(): QuotaData | null {
    return this.props.newQuota ? { ...this.props.newQuota } : null; // Return copy
  }

  get changedByUserId(): number | null {
    return this.props.changedByUserId;
  }

  get changeReason(): string | null {
    return this.props.changeReason;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business logic methods

  /**
   * Check if this is a plan change (upgrade or downgrade)
   */
  isPlanChange(): boolean {
    return this.props.changeType === 'plan_upgrade' || this.props.changeType === 'plan_downgrade';
  }

  /**
   * Check if this is a quota change
   */
  isQuotaChange(): boolean {
    return this.props.changeType === 'quota_increase' || this.props.changeType === 'quota_decrease';
  }

  /**
   * Check if this is a cancellation
   */
  isCancellation(): boolean {
    return this.props.changeType === 'cancellation';
  }

  /**
   * Check if this is a reactivation
   */
  isReactivation(): boolean {
    return this.props.changeType === 'reactivation';
  }

  /**
   * Check if this was a self-service change (user-initiated)
   */
  isSelfService(): boolean {
    // Self-service if changed_by_user_id equals user_id or is null (automated)
    return (
      this.props.changedByUserId === null ||
      this.props.changedByUserId === this.props.userId
    );
  }

  /**
   * Check if this was an admin change
   */
  isAdminChange(): boolean {
    return (
      this.props.changedByUserId !== null &&
      this.props.changedByUserId !== this.props.userId
    );
  }

  /**
   * Get human-readable description of the change
   */
  getDescription(): string {
    const descriptions: Record<SubscriptionChangeType, string> = {
      plan_upgrade: `Upgraded from ${this.props.oldPlan} to ${this.props.newPlan}`,
      plan_downgrade: `Downgraded from ${this.props.oldPlan} to ${this.props.newPlan}`,
      quota_increase: 'Quota increased',
      quota_decrease: 'Quota decreased',
      cancellation: 'Subscription cancelled',
      reactivation: 'Subscription reactivated',
      trial_started: 'Trial started',
      trial_expired: 'Trial expired'
    };

    return descriptions[this.props.changeType];
  }

  /**
   * Get quota changes as human-readable strings
   */
  getQuotaChanges(): { field: string; oldValue: string; newValue: string }[] {
    if (!this.props.oldQuota || !this.props.newQuota) {
      return [];
    }

    const changes: { field: string; oldValue: string; newValue: string }[] = [];

    // Compare max_contacts
    if (this.props.oldQuota.max_contacts !== this.props.newQuota.max_contacts) {
      changes.push({
        field: 'Max Contacts',
        oldValue: this.props.oldQuota.max_contacts?.toLocaleString() || 'N/A',
        newValue: this.props.newQuota.max_contacts?.toLocaleString() || 'N/A'
      });
    }

    // Compare max_monthly_emails
    if (this.props.oldQuota.max_monthly_emails !== this.props.newQuota.max_monthly_emails) {
      changes.push({
        field: 'Max Monthly Emails',
        oldValue:
          this.props.oldQuota.max_monthly_emails === null
            ? 'Unlimited'
            : this.props.oldQuota.max_monthly_emails?.toLocaleString() || 'N/A',
        newValue:
          this.props.newQuota.max_monthly_emails === null
            ? 'Unlimited'
            : this.props.newQuota.max_monthly_emails?.toLocaleString() || 'N/A'
      });
    }

    return changes;
  }

  /**
   * Return subscription history data as plain object (for API responses)
   */
  toJSON(): {
    id: number;
    userId: number;
    changeType: SubscriptionChangeType;
    oldPlan: string | null;
    newPlan: string | null;
    oldQuota: QuotaData | null;
    newQuota: QuotaData | null;
    changedByUserId: number | null;
    changeReason: string | null;
    ipAddress: string | null;
    createdAt: Date;
    description: string;
    isSelfService: boolean;
  } {
    return {
      id: this.props.id,
      userId: this.props.userId,
      changeType: this.props.changeType,
      oldPlan: this.props.oldPlan,
      newPlan: this.props.newPlan,
      oldQuota: this.oldQuota,
      newQuota: this.newQuota,
      changedByUserId: this.props.changedByUserId,
      changeReason: this.props.changeReason,
      ipAddress: this.props.ipAddress,
      createdAt: this.props.createdAt,
      description: this.getDescription(),
      isSelfService: this.isSelfService()
    };
  }

  // Static factory methods

  /**
   * Create SubscriptionHistory entity from database row
   * Used by repositories when fetching from database
   */
  static fromDatabase(
    id: number,
    userId: number,
    changeType: SubscriptionChangeType,
    oldPlan: string | null,
    newPlan: string | null,
    oldQuota: QuotaData | null | any, // Handle JSONB
    newQuota: QuotaData | null | any, // Handle JSONB
    changedByUserId: number | null,
    changeReason: string | null,
    ipAddress: string | null,
    userAgent: string | null,
    createdAt: Date
  ): SubscriptionHistory {
    // Parse JSONB quota data if needed
    const parseQuota = (quota: any): QuotaData | null => {
      if (quota === null) return null;
      if (typeof quota === 'string') {
        try {
          return JSON.parse(quota);
        } catch {
          return null;
        }
      }
      return quota;
    };

    return new SubscriptionHistory({
      id,
      userId,
      changeType,
      oldPlan,
      newPlan,
      oldQuota: parseQuota(oldQuota),
      newQuota: parseQuota(newQuota),
      changedByUserId,
      changeReason,
      ipAddress,
      userAgent,
      createdAt
    });
  }

  /**
   * Factory method to create plan upgrade history entry
   */
  static createPlanUpgrade(
    userId: number,
    oldPlan: string,
    newPlan: string,
    ipAddress: string | null,
    userAgent: string | null,
    changeReason?: string
  ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory> {
    return {
      userId,
      changeType: 'plan_upgrade' as SubscriptionChangeType,
      oldPlan,
      newPlan,
      oldQuota: null,
      newQuota: null,
      changedByUserId: null, // Self-service
      changeReason: changeReason || 'User upgraded subscription plan',
      ipAddress,
      userAgent
    } as any;
  }

  /**
   * Factory method to create plan downgrade history entry
   */
  static createPlanDowngrade(
    userId: number,
    oldPlan: string,
    newPlan: string,
    ipAddress: string | null,
    userAgent: string | null,
    changeReason?: string
  ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory> {
    return {
      userId,
      changeType: 'plan_downgrade' as SubscriptionChangeType,
      oldPlan,
      newPlan,
      oldQuota: null,
      newQuota: null,
      changedByUserId: null, // Self-service
      changeReason: changeReason || 'User downgraded subscription plan',
      ipAddress,
      userAgent
    } as any;
  }

  /**
   * Factory method to create quota change history entry
   */
  static createQuotaChange(
    userId: number,
    oldQuota: QuotaData,
    newQuota: QuotaData,
    changedByUserId: number | null,
    changeReason: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory> {
    // Determine if this is an increase or decrease
    const isIncrease =
      (newQuota.max_contacts || 0) > (oldQuota.max_contacts || 0) ||
      (newQuota.max_monthly_emails === null && oldQuota.max_monthly_emails !== null) ||
      (newQuota.max_monthly_emails || 0) > (oldQuota.max_monthly_emails || 0);

    return {
      userId,
      changeType: (isIncrease ? 'quota_increase' : 'quota_decrease') as SubscriptionChangeType,
      oldPlan: null,
      newPlan: null,
      oldQuota,
      newQuota,
      changedByUserId,
      changeReason,
      ipAddress,
      userAgent
    } as any;
  }

  /**
   * Factory method to create cancellation history entry
   */
  static createCancellation(
    userId: number,
    currentPlan: string,
    ipAddress: string | null,
    userAgent: string | null,
    changeReason?: string
  ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory> {
    return {
      userId,
      changeType: 'cancellation' as SubscriptionChangeType,
      oldPlan: currentPlan,
      newPlan: 'Free', // Downgrade to free on cancellation
      oldQuota: null,
      newQuota: null,
      changedByUserId: null, // Self-service
      changeReason: changeReason || 'User cancelled subscription',
      ipAddress,
      userAgent
    } as any;
  }
}
