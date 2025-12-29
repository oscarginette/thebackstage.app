/**
 * CancelSubscriptionUseCase
 *
 * Cancels an active subscription.
 * Supports immediate cancellation or cancellation at period end.
 *
 * Clean Architecture: Use Case orchestrates repositories.
 * SOLID: Single Responsibility (only cancels subscriptions).
 */

import { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';

export interface CancelSubscriptionInput {
  subscriptionId: string;
  userId: number;
  cancelAtPeriodEnd?: boolean;  // If true, cancel at end of billing period
  reason?: string;
}

export interface CancelSubscriptionOutput {
  success: boolean;
  message: string;
  canceledAt?: Date;
  willCancelAt?: Date;
}

export class CancelSubscriptionUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  /**
   * Execute use case
   * Cancels subscription immediately or schedules cancellation
   */
  async execute(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
    // Step 1: Validate input
    this.validateInput(input);

    // Step 2: Fetch subscription
    const subscription = await this.subscriptionRepository.findById(input.subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${input.subscriptionId} not found`);
    }

    // Step 3: Verify ownership
    if (subscription.customerId !== input.userId) {
      throw new Error('Unauthorized: You can only cancel your own subscriptions');
    }

    // Step 4: Check if already canceled
    if (subscription.isCanceled()) {
      return {
        success: false,
        message: 'Subscription is already canceled',
      };
    }

    // Step 5: Cancel subscription
    if (input.cancelAtPeriodEnd) {
      // Schedule cancellation at period end
      const updatedSubscription = subscription.scheduleCancellation();

      await this.subscriptionRepository.updateStatus(
        updatedSubscription.id,
        updatedSubscription.status
      );

      return {
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        willCancelAt: subscription.currentPeriodEnd,
      };
    } else {
      // Immediate cancellation
      const canceledAt = new Date();
      await this.subscriptionRepository.cancel(subscription.id, canceledAt);

      return {
        success: true,
        message: 'Subscription canceled successfully',
        canceledAt,
      };
    }
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private validateInput(input: CancelSubscriptionInput): void {
    if (!input.subscriptionId || !input.subscriptionId.startsWith('sub_')) {
      throw new Error('Invalid subscription ID format');
    }

    if (!input.userId || input.userId <= 0) {
      throw new Error('Invalid user ID');
    }
  }
}
