/**
 * GET /api/products
 *
 * Returns all active products with their monthly and yearly pricing.
 * Public endpoint for pricing page.
 *
 * Clean Architecture: API layer only orchestrates, no business logic.
 */

import { NextResponse } from 'next/server';
import { GetProductsWithPricesUseCase } from '@/domain/services/GetProductsWithPricesUseCase';
import {
  productRepository,
  priceRepository,
} from '@/infrastructure/database/repositories';

export async function GET() {
  try {
    // Initialize use case
    const useCase = new GetProductsWithPricesUseCase(
      productRepository,
      priceRepository
    );

    // Execute
    const result = await useCase.execute();

    // Transform to API format
    const apiResponse = result.products.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      features: item.product.marketingFeatures,
      limits: {
        maxContacts: item.product.getMaxContacts(),
        maxMonthlyEmails: item.product.getMaxMonthlyEmails(),
        maxActiveGates: item.product.getMaxActiveGates(),
      },
      pricing: {
        monthly: item.monthlyPrice
          ? {
              id: item.monthlyPrice.id,
              amount: item.monthlyPrice.getPriceInEur(),
              currency: item.monthlyPrice.currency,
              formatted: item.monthlyPrice.getFormattedPrice(),
            }
          : null,
        yearly: item.yearlyPrice
          ? {
              id: item.yearlyPrice.id,
              amount: item.yearlyPrice.getPriceInEur(),
              currency: item.yearlyPrice.currency,
              formatted: item.yearlyPrice.getFormattedPrice(),
              discountPercentage: item.yearlyPrice.getDiscountPercentage(),
              savingsEur: item.yearlyPrice.getYearlySavingsEur(),
              monthlyEquivalent: item.yearlyPrice.getMonthlyEquivalentPrice(),
            }
          : null,
      },
      tier: item.product.getPlanTier(),
      active: item.product.active,
    }));

    return NextResponse.json(
      {
        products: apiResponse,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}
