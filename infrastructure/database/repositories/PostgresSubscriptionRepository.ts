/**
 * PostgresSubscriptionRepository
 *
 * PostgreSQL implementation of ISubscriptionRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository';
import { Subscription } from '@/domain/entities/Subscription';
import type {
  SubscriptionStatus,
  CollectionMethod,
  SubscriptionMetadata,
} from '@/domain/types/stripe';

export class PostgresSubscriptionRepository implements ISubscriptionRepository {
  /**
   * Create new subscription
   */
  async create(subscription: Subscription): Promise<Subscription> {
    const result = await sql`
      INSERT INTO subscriptions (
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      )
      VALUES (
        ${subscription.id},
        ${subscription.object},
        ${subscription.customerId},
        ${subscription.status},
        ${subscription.currentPeriodStart},
        ${subscription.currentPeriodEnd},
        ${subscription.billingCycleAnchor},
        ${subscription.cancelAtPeriodEnd},
        ${subscription.cancelAt},
        ${subscription.canceledAt},
        ${subscription.endedAt},
        ${subscription.trialStart},
        ${subscription.trialEnd},
        ${subscription.created},
        ${subscription.startDate},
        ${JSON.stringify(subscription.metadata)},
        ${subscription.collectionMethod},
        ${subscription.livemode}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create subscription');
    }

    return this.mapToDomain(result.rows[0]);
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string): Promise<Subscription | null> {
    const result = await sql`
      SELECT
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      FROM subscriptions
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  /**
   * Find all subscriptions for a customer (user)
   */
  async findByCustomerId(customerId: number): Promise<Subscription[]> {
    const result = await sql`
      SELECT
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      FROM subscriptions
      WHERE customer_id = ${customerId}
      ORDER BY created DESC
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Find active subscription for a customer
   * Returns the most recent active subscription
   */
  async findActiveByCustomerId(customerId: number): Promise<Subscription | null> {
    const result = await sql`
      SELECT
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      FROM subscriptions
      WHERE customer_id = ${customerId}
        AND status IN ('active', 'trialing')
      ORDER BY created DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  /**
   * Find subscriptions by status
   */
  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    const result = await sql`
      SELECT
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      FROM subscriptions
      WHERE status = ${status}
      ORDER BY created DESC
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Find subscriptions expiring within N days
   */
  async findExpiringSoon(days: number): Promise<Subscription[]> {
    const result = await sql`
      SELECT
        id,
        object,
        customer_id,
        status,
        current_period_start,
        current_period_end,
        billing_cycle_anchor,
        cancel_at_period_end,
        cancel_at,
        canceled_at,
        ended_at,
        trial_start,
        trial_end,
        created,
        start_date,
        metadata,
        collection_method,
        livemode
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
        AND current_period_end <= NOW() + INTERVAL '1 day' * ${days}
        AND current_period_end > NOW()
      ORDER BY current_period_end ASC
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Update subscription status
   */
  async updateStatus(id: string, status: SubscriptionStatus): Promise<void> {
    await sql`
      UPDATE subscriptions
      SET
        status = ${status},
        updated = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, canceledAt: Date): Promise<void> {
    await sql`
      UPDATE subscriptions
      SET
        status = 'canceled',
        canceled_at = ${canceledAt},
        ended_at = ${canceledAt},
        updated = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  }

  /**
   * Delete subscription (soft delete by marking as canceled)
   */
  async delete(id: string): Promise<void> {
    await this.cancel(id, new Date());
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Map database row to Subscription domain entity
   */
  private mapToDomain(row: any): Subscription {
    return new Subscription(
      row.id,
      row.object,
      row.customer_id,
      row.status as SubscriptionStatus,
      new Date(row.current_period_start),
      new Date(row.current_period_end),
      new Date(row.billing_cycle_anchor),
      row.cancel_at_period_end,
      row.cancel_at ? new Date(row.cancel_at) : null,
      row.canceled_at ? new Date(row.canceled_at) : null,
      row.ended_at ? new Date(row.ended_at) : null,
      row.trial_start ? new Date(row.trial_start) : null,
      row.trial_end ? new Date(row.trial_end) : null,
      new Date(row.created),
      new Date(row.start_date),
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata as SubscriptionMetadata),
      row.collection_method as CollectionMethod,
      row.livemode
    );
  }
}
