/**
 * PostgresPricingPlanRepository
 *
 * PostgreSQL implementation of IPricingPlanRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { IPricingPlanRepository } from '@/domain/repositories/IPricingPlanRepository';
import { PricingPlan, SubscriptionPlanName } from '@/domain/types/subscriptions';

export class PostgresPricingPlanRepository implements IPricingPlanRepository {
  /**
   * Get all pricing plans
   * Returns both active and inactive plans
   */
  async findAll(): Promise<PricingPlan[]> {
    try {
      const result = await sql`
        SELECT
          id,
          plan_name,
          max_contacts,
          max_monthly_emails,
          price_monthly_eur,
          features,
          active,
          created_at,
          updated_at
        FROM pricing_plans
        ORDER BY
          CASE plan_name
            WHEN 'Free' THEN 1
            WHEN 'Pro' THEN 2
            WHEN 'Business' THEN 3
            WHEN 'Unlimited' THEN 4
          END
      `;

      return result.rows.map((row: any) => this.mapRowToPricingPlan(row));
    } catch (error) {
      console.error('PostgresPricingPlanRepository.findAll error:', error);
      throw new Error(
        `Failed to get all pricing plans: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get only active pricing plans
   * Used for displaying available subscription options to users
   */
  async findActive(): Promise<PricingPlan[]> {
    try {
      const result = await sql`
        SELECT
          id,
          plan_name,
          max_contacts,
          max_monthly_emails,
          price_monthly_eur,
          features,
          active,
          created_at,
          updated_at
        FROM pricing_plans
        WHERE active = true
        ORDER BY
          CASE plan_name
            WHEN 'Free' THEN 1
            WHEN 'Pro' THEN 2
            WHEN 'Business' THEN 3
            WHEN 'Unlimited' THEN 4
          END
      `;

      return result.rows.map((row: any) => this.mapRowToPricingPlan(row));
    } catch (error) {
      console.error('PostgresPricingPlanRepository.findActive error:', error);
      throw new Error(
        `Failed to get active pricing plans: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find pricing plan by name
   * @param planName - Name of the plan (case-insensitive)
   */
  async findByName(planName: SubscriptionPlanName): Promise<PricingPlan | null> {
    try {
      // Capitalize first letter to match database format (Free, Pro, Unlimited)
      const dbPlanName = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();

      const result = await sql`
        SELECT
          id,
          plan_name,
          max_contacts,
          max_monthly_emails,
          price_monthly_eur,
          features,
          active,
          created_at,
          updated_at
        FROM pricing_plans
        WHERE LOWER(plan_name) = LOWER(${dbPlanName})
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToPricingPlan(result.rows[0]);
    } catch (error) {
      console.error('PostgresPricingPlanRepository.findByName error:', error);
      throw new Error(
        `Failed to find pricing plan by name: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map database row to PricingPlan domain entity
   * SECURITY: Ensures type safety and validates data from database
   * @private
   */
  private mapRowToPricingPlan(row: any): PricingPlan {
    // Convert plan_name from database format (Free, Pro, Business, Unlimited)
    // to domain format (free, pro, unlimited)
    const planName = row.plan_name.toLowerCase() as SubscriptionPlanName;

    // Parse features JSON array
    const features = Array.isArray(row.features) ? row.features : [];

    // Convert EUR price to cents for consistency
    const priceMonthly = Math.round(parseFloat(row.price_monthly_eur) * 100);

    // Calculate yearly price (10 months for the price of 12)
    const priceYearly = priceMonthly * 10;

    return {
      id: row.id,
      name: planName,
      displayName: row.plan_name,
      maxContacts: row.max_contacts,
      maxMonthlyEmails: row.max_monthly_emails,
      priceMonthly,
      priceYearly,
      features,
      active: row.active,
      createdAt: new Date(row.created_at),
    };
  }
}
