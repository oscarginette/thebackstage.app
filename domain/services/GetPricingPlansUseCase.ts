/**
 * GetPricingPlansUseCase
 *
 * Retrieves active pricing plans for public display.
 * Transforms database pricing plans into API-friendly format.
 *
 * Clean Architecture: Business logic isolated from database concerns.
 * SOLID: Single Responsibility (only handles pricing plan retrieval).
 */

import { IPricingPlanRepository } from '@/domain/repositories/IPricingPlanRepository';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

export interface PricingPlanDTO {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  currency: string;
  features: string[];
  limits: {
    gates: number | 'unlimited';
    contacts: number;
    emailsPerMonth: number | 'unlimited';
  };
  highlighted: boolean;
  badge?: string;
}

export interface GetPricingPlansResult {
  plans: PricingPlanDTO[];
  success: true;
}

/**
 * GetPricingPlansUseCase
 *
 * Fetches active pricing plans and formats them for public consumption.
 */
export class GetPricingPlansUseCase {
  constructor(private pricingPlanRepository: IPricingPlanRepository) {}

  /**
   * Execute the use case
   *
   * @returns Formatted pricing plans for API response
   */
  async execute(): Promise<GetPricingPlansResult> {
    // Fetch active plans from repository
    const plans = await this.pricingPlanRepository.findActive();

    // Transform to API format
    const formattedPlans: PricingPlanDTO[] = plans.map((plan) => ({
      id: plan.name,
      name: plan.displayName,
      price: plan.priceMonthly / 100, // Convert cents to euros
      billingPeriod: 'month' as const,
      currency: 'EUR',
      features: plan.features,
      limits: {
        gates: 'unlimited', // All plans have unlimited gates
        contacts: plan.maxContacts,
        emailsPerMonth:
          plan.maxMonthlyEmails === null ? 'unlimited' : plan.maxMonthlyEmails,
      },
      highlighted: plan.name === SUBSCRIPTION_PLANS.PRO, // Pro plan is most popular
      badge: plan.name === SUBSCRIPTION_PLANS.PRO ? 'Most Popular' : undefined,
    }));

    return {
      plans: formattedPlans,
      success: true,
    };
  }
}
