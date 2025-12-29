/**
 * GetProductsWithPricesUseCase
 *
 * Retrieves all products with their associated prices.
 * Returns products ordered by tier (Free → Pro → Business → Unlimited).
 *
 * Clean Architecture: Use Case orchestrates repositories.
 * SOLID: Single Responsibility (only fetches products + prices).
 */

import { IProductRepository } from '../repositories/IProductRepository';
import { IPriceRepository } from '../repositories/IPriceRepository';
import { Product } from '../entities/Product';
import { Price } from '../entities/Price';

export interface ProductWithPrices {
  product: Product;
  monthlyPrice: Price | null;
  yearlyPrice: Price | null;
}

export interface GetProductsWithPricesOutput {
  products: ProductWithPrices[];
}

export class GetProductsWithPricesUseCase {
  constructor(
    private productRepository: IProductRepository,
    private priceRepository: IPriceRepository
  ) {}

  /**
   * Execute use case
   * Returns all active products with their monthly/yearly prices
   */
  async execute(): Promise<GetProductsWithPricesOutput> {
    // Step 1: Get all active products
    const products = await this.productRepository.findActive();

    // Step 2: For each product, fetch its monthly and yearly prices
    const productsWithPrices: ProductWithPrices[] = [];

    for (const product of products) {
      // Fetch monthly price
      const monthlyPrice = await this.priceRepository.findByProductAndPeriod(
        product.id,
        'monthly'
      );

      // Fetch yearly price
      const yearlyPrice = await this.priceRepository.findByProductAndPeriod(
        product.id,
        'yearly'
      );

      productsWithPrices.push({
        product,
        monthlyPrice,
        yearlyPrice,
      });
    }

    return {
      products: productsWithPrices,
    };
  }
}
