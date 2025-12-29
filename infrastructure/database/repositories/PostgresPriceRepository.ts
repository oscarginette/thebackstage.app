/**
 * PostgresPriceRepository
 *
 * PostgreSQL implementation of IPriceRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { IPriceRepository } from '@/domain/repositories/IPriceRepository';
import { Price } from '@/domain/entities/Price';
import type {
  BillingPeriod,
  RecurringInterval,
  PriceType,
  PriceMetadata,
} from '@/domain/types/stripe';
import { billingPeriodToInterval } from '@/domain/types/stripe';

export class PostgresPriceRepository implements IPriceRepository {
  /**
   * Get all prices (including inactive)
   */
  async findAll(): Promise<Price[]> {
    const result = await sql`
      SELECT
        id,
        object,
        product_id,
        active,
        currency,
        unit_amount,
        unit_amount_decimal,
        type,
        billing_scheme,
        recurring_interval,
        recurring_interval_count,
        recurring_usage_type,
        metadata,
        created,
        updated,
        livemode
      FROM prices
      ORDER BY product_id, recurring_interval
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Get only active prices
   */
  async findActive(): Promise<Price[]> {
    const result = await sql`
      SELECT
        id,
        object,
        product_id,
        active,
        currency,
        unit_amount,
        unit_amount_decimal,
        type,
        billing_scheme,
        recurring_interval,
        recurring_interval_count,
        recurring_usage_type,
        metadata,
        created,
        updated,
        livemode
      FROM prices
      WHERE active = true
      ORDER BY product_id, recurring_interval
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Find price by ID
   */
  async findById(id: string): Promise<Price | null> {
    const result = await sql`
      SELECT
        id,
        object,
        product_id,
        active,
        currency,
        unit_amount,
        unit_amount_decimal,
        type,
        billing_scheme,
        recurring_interval,
        recurring_interval_count,
        recurring_usage_type,
        metadata,
        created,
        updated,
        livemode
      FROM prices
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  /**
   * Find all prices for a specific product
   */
  async findByProductId(productId: string): Promise<Price[]> {
    const result = await sql`
      SELECT
        id,
        object,
        product_id,
        active,
        currency,
        unit_amount,
        unit_amount_decimal,
        type,
        billing_scheme,
        recurring_interval,
        recurring_interval_count,
        recurring_usage_type,
        metadata,
        created,
        updated,
        livemode
      FROM prices
      WHERE product_id = ${productId}
      ORDER BY recurring_interval
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Find price for a specific product and billing period
   * Example: findByProductAndPeriod('prod_Pro', 'yearly')
   */
  async findByProductAndPeriod(
    productId: string,
    period: BillingPeriod
  ): Promise<Price | null> {
    const interval = billingPeriodToInterval(period);

    const result = await sql`
      SELECT
        id,
        object,
        product_id,
        active,
        currency,
        unit_amount,
        unit_amount_decimal,
        type,
        billing_scheme,
        recurring_interval,
        recurring_interval_count,
        recurring_usage_type,
        metadata,
        created,
        updated,
        livemode
      FROM prices
      WHERE product_id = ${productId}
        AND recurring_interval = ${interval}
        AND active = true
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Map database row to Price domain entity
   */
  private mapToDomain(row: any): Price {
    return new Price(
      row.id,
      row.object,
      row.product_id,
      row.active,
      row.currency,
      row.unit_amount,
      row.unit_amount_decimal,
      row.type as PriceType,
      row.billing_scheme,
      row.recurring_interval as RecurringInterval | null,
      row.recurring_interval_count,
      row.recurring_usage_type,
      row.metadata as PriceMetadata,
      new Date(row.created),
      new Date(row.updated),
      row.livemode
    );
  }
}
