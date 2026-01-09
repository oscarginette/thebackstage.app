/**
 * Pricing API Route
 *
 * Public endpoint to fetch pricing plan information from database.
 * No authentication required.
 *
 * Clean Architecture: API route orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

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
    const useCase = UseCaseFactory.createGetPricingPlansUseCase();
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans', success: false },
      { status: 500 }
    );
  }
}
