/**
 * ISubscriptionHistoryRepository Interface
 *
 * Repository contract for subscription history operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 *
 * GDPR: Maintains audit trail for all subscription changes (Article 30)
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

export interface SubscriptionHistory {
  id: number;
  userId: number;
  changeType: SubscriptionChangeType;
  oldPlan: string | null;
  newPlan: string | null;
  oldQuota: Record<string, any> | null;
  newQuota: Record<string, any> | null;
  changedByUserId: number | null;
  changeReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateSubscriptionHistoryInput {
  userId: number;
  changeType: SubscriptionChangeType;
  oldPlan?: string | null;
  newPlan?: string | null;
  oldQuota?: Record<string, any> | null;
  newQuota?: Record<string, any> | null;
  changedByUserId?: number | null;
  changeReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ISubscriptionHistoryRepository {
  /**
   * Create new subscription history entry
   * GDPR: Audit trail for subscription changes (Article 30)
   * @param input - Subscription history data
   * @returns Created SubscriptionHistory entity
   */
  create(input: CreateSubscriptionHistoryInput): Promise<SubscriptionHistory>;

  /**
   * Find subscription history by user ID
   * @param userId - User identifier
   * @param limit - Maximum number of records to return (optional)
   * @returns Array of subscription history entries, ordered by created_at DESC
   */
  findByUserId(userId: number, limit?: number): Promise<SubscriptionHistory[]>;
}
