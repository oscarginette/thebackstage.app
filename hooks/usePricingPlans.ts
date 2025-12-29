/**
 * usePricingPlans Hook
 *
 * Centralizes pricing plan data and calculations.
 * Single source of truth for plan information across the application.
 *
 * Clean Architecture: Presentation layer hook for business logic.
 */

export interface Plan {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  contacts: number;
  emails: number | string;
  features: string[];
  popular?: boolean;
}

export interface PlanWithCalculatedPrice extends Plan {
  calculatedPrice: number;
}

/**
 * Yearly discount percentage
 * 0.2 = 20% discount
 */
const YEARLY_DISCOUNT = 0.2;

/**
 * Calculate price with optional yearly discount
 */
function calculatePrice(basePrice: number, isYearly: boolean): number {
  if (basePrice === 0) return 0;
  return isYearly ? basePrice * (1 - YEARLY_DISCOUNT) : basePrice;
}

/**
 * Get all available pricing plans
 * Source of truth for plan data
 */
function getPlans(): Plan[] {
  return [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfecto para validar tu proyecto',
      basePrice: 0,
      contacts: 500,
      emails: 2000,
      features: [
        '500 Contactos',
        '2,000 Emails / mes',
        'Download Gates Ilimitados',
        'Analytics Básicos',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para artistas en crecimiento',
      basePrice: 9.99,
      contacts: 2500,
      emails: 10000,
      features: [
        '2,500 Contactos',
        '10,000 Emails / mes',
        'Download Gates Ilimitados',
        'Insights Avanzados',
        'Soporte Prioritario',
      ],
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Escala tu base de fans',
      basePrice: 19.99,
      contacts: 15000,
      emails: 60000,
      features: [
        '15,000 Contactos',
        '60,000 Emails / mes',
        'Download Gates Ilimitados',
        'Insights Avanzados',
        'Soporte Prioritario',
      ],
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      description: 'Máximo poder',
      basePrice: 39.99,
      contacts: 15000,
      emails: 'Ilimitados',
      features: [
        '15,000+ Contactos',
        'Emails Ilimitados',
        'Download Gates Ilimitados',
        'Insights Avanzados',
        'Manager Dedicado',
      ],
    },
  ];
}

/**
 * Hook for pricing plans with calculated prices
 *
 * @param billingPeriod - 'monthly' or 'yearly'
 * @returns Array of plans with calculated prices based on billing period
 */
export function usePricingPlans(
  billingPeriod: 'monthly' | 'yearly'
): PlanWithCalculatedPrice[] {
  const plans = getPlans();
  const isYearly = billingPeriod === 'yearly';

  return plans.map((plan) => ({
    ...plan,
    calculatedPrice: calculatePrice(plan.basePrice, isYearly),
  }));
}

/**
 * Get yearly discount percentage for display
 */
export function getYearlyDiscountPercentage(): number {
  return YEARLY_DISCOUNT * 100;
}
