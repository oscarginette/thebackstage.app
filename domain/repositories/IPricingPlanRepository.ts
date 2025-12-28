/**
 * IPricingPlanRepository Interface
 *
 * Repository contract for pricing plan operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 */

import { PricingPlan, SubscriptionPlanName } from '../types/subscriptions';

export interface IPricingPlanRepository {
  /**
   * Get all pricing plans
   * @returns Array of all pricing plans (active and inactive)
   */
  findAll(): Promise<PricingPlan[]>;

  /**
   * Get only active pricing plans
   * Used for displaying available subscription options to users
   * @returns Array of active pricing plans
   */
  findActive(): Promise<PricingPlan[]>;

  /**
   * Find pricing plan by name
   * @param planName - Name of the plan (free, pro, unlimited)
   * @returns PricingPlan or null if not found
   */
  findByName(planName: SubscriptionPlanName): Promise<PricingPlan | null>;
}
