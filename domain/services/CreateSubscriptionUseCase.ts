/**
 * CreateSubscriptionUseCase
 *
 * Creates a new subscription for a user with a specific price.
 * Handles subscription creation with billing cycle calculation.
 *
 * Clean Architecture: Use Case orchestrates repositories.
 * SOLID: Single Responsibility (only creates subscriptions).
 */

import { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import { IPriceRepository } from '../repositories/IPriceRepository';
import { IProductRepository } from '../repositories/IProductRepository';
import { Subscription } from '../entities/Subscription';
import { Price } from '../entities/Price';
import { Product } from '../entities/Product';
import type { BillingPeriod } from '../types/stripe';
import { getDurationMonths } from '../types/stripe';

export interface CreateSubscriptionInput {
  userId: number;
  priceId: string;
  startDate?: Date;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionOutput {
  success: boolean;
  subscription: {
    id: string;
    userId: number;
    productName: string;
    billingPeriod: BillingPeriod;
    price: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    status: string;
  };
}

export class CreateSubscriptionUseCase {
  constructor(
    private subscriptionRepository: ISubscriptionRepository,
    private priceRepository: IPriceRepository,
    private productRepository: IProductRepository
  ) {}

  /**
   * Execute use case
   * Creates subscription with proper billing cycle
   */
  async execute(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    // Step 1: Validate input
    this.validateInput(input);

    // Step 2: Fetch price and validate it exists
    const price = await this.priceRepository.findById(input.priceId);
    if (!price) {
      throw new Error(`Price with ID ${input.priceId} not found`);
    }

    if (!price.active) {
      throw new Error(`Price ${input.priceId} is not active`);
    }

    // Step 3: Fetch product
    const product = await this.productRepository.findById(price.productId);
    if (!product) {
      throw new Error(`Product ${price.productId} not found`);
    }

    if (!product.active) {
      throw new Error(`Product ${price.productId} is not active`);
    }

    // Step 4: Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findActiveByCustomerId(
      input.userId
    );

    if (existingSubscription) {
      throw new Error(
        'User already has an active subscription. Cancel the existing subscription first.'
      );
    }

    // Step 5: Calculate billing cycle
    const startDate = input.startDate ?? new Date();
    const billingPeriod = price.getBillingPeriod() ?? 'monthly';
    const durationMonths = getDurationMonths(billingPeriod);

    const currentPeriodEnd = new Date(startDate);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + durationMonths);

    // Step 6: Handle trial period (if specified)
    let trialStart: Date | null = null;
    let trialEnd: Date | null = null;
    let subscriptionStatus: 'trialing' | 'active' = 'active';

    if (input.trialDays && input.trialDays > 0) {
      trialStart = startDate;
      trialEnd = new Date(startDate);
      trialEnd.setDate(trialEnd.getDate() + input.trialDays);
      subscriptionStatus = 'trialing';
    }

    // Step 7: Generate subscription ID
    const subscriptionId = this.generateSubscriptionId();

    // Step 8: Create subscription entity
    const subscription = Subscription.create({
      id: subscriptionId,
      customerId: input.userId,
      status: subscriptionStatus,
      currentPeriodStart: startDate,
      currentPeriodEnd,
      billingCycleAnchor: startDate,
      trialStart,
      trialEnd,
      startDate,
      metadata: {
        product_name: product.name,
        price_id: price.id,
        billing_period: billingPeriod,
        ...input.metadata,
      },
    });

    // Step 9: Save to database
    const createdSubscription = await this.subscriptionRepository.create(subscription);

    // Step 10: Return result
    return {
      success: true,
      subscription: {
        id: createdSubscription.id,
        userId: input.userId,
        productName: product.name,
        billingPeriod,
        price: price.getPriceInEur(),
        currentPeriodStart: createdSubscription.currentPeriodStart,
        currentPeriodEnd: createdSubscription.currentPeriodEnd,
        status: createdSubscription.getFormattedStatus(),
      },
    };
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private validateInput(input: CreateSubscriptionInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new Error('Invalid userId');
    }

    if (!input.priceId || !input.priceId.startsWith('price_')) {
      throw new Error('Invalid priceId format. Must start with "price_"');
    }

    if (input.trialDays && (input.trialDays < 0 || input.trialDays > 365)) {
      throw new Error('Trial days must be between 0 and 365');
    }
  }

  /**
   * Generate unique subscription ID (Stripe format)
   * Format: sub_xxxxxxxxxxxxxxxxxxxxx (24 chars)
   */
  private generateSubscriptionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `sub_${timestamp}${randomPart}`.substring(0, 27); // Stripe IDs are ~27 chars
  }
}
