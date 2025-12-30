/**
 * Pricing API Route
 *
 * Public endpoint to fetch pricing plan information from database.
 * No authentication required.
 *
 * Clean Architecture: API route orchestrates, data from repository.
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface PricingPlan {
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

/**
 * GET /api/pricing
 *
 * Fetch active pricing plans from database
 *
 * Response:
 * {
 *   plans: PricingPlan[],
 *   success: true
 * }
 */
export async function GET() {
  try {
    // Fetch pricing plans from database
    const result = await sql`
      SELECT
        id,
        plan_name,
        max_contacts,
        max_monthly_emails,
        price_monthly_eur,
        features
      FROM pricing_plans
      WHERE active = true
      ORDER BY price_monthly_eur ASC
    `;

    // Transform database rows to API response format
    const plans: PricingPlan[] = result.rows.map((row: any) => {
      const planName = row.plan_name.toLowerCase();

      return {
        id: planName,
        name: row.plan_name,
        price: parseFloat(row.price_monthly_eur),
        billingPeriod: 'month' as const,
        currency: 'EUR',
        features: row.features || [],
        limits: {
          gates: 'unlimited', // All plans have unlimited gates
          contacts: row.max_contacts,
          emailsPerMonth:
            row.max_monthly_emails === null ? 'unlimited' : row.max_monthly_emails,
        },
        highlighted: planName === SUBSCRIPTION_PLANS.PRO, // Pro plan is most popular
        badge: planName === SUBSCRIPTION_PLANS.PRO ? 'Most Popular' : undefined,
      };
    });

    return NextResponse.json({
      plans,
      success: true,
    });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans', success: false },
      { status: 500 }
    );
  }
}
