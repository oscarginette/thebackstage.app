/**
 * ActivateUserSubscriptionUseCase
 *
 * Handles user subscription activation with audit trail.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Fetches pricing plan configuration from repository
 * - Updates user subscription fields (plan, limits, dates)
 * - Creates audit history entry for GDPR compliance
 * - Supports subscription duration in months
 *
 * CRITICAL: Main subscription activation flow for manual admin activation
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IPricingPlanRepository } from '../repositories/IPricingPlanRepository';
import { ISubscriptionHistoryRepository } from '../repositories/ISubscriptionHistoryRepository';
import { SubscriptionPlanName } from '../types/subscriptions';

export interface ActivateUserSubscriptionInput {
  userId: number;
  planName: SubscriptionPlanName;
  durationMonths?: number; // Default: 1 month
  changedBy?: number; // Admin user ID who activated
  ipAddress?: string; // For audit trail
  notes?: string;
}

export interface ActivateUserSubscriptionResult {
  success: boolean;
  error?: string;
  subscription?: {
    planName: SubscriptionPlanName;
    maxContacts: number;
    maxMonthlyEmails: number;
    startDate: Date;
    expiresAt?: Date;
  };
}

/**
 * ActivateUserSubscriptionUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (subscription activation)
 * - OCP: Open for extension (easy to add new plan types)
 * - LSP: Works with any repository implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */
export class ActivateUserSubscriptionUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly pricingPlanRepository: IPricingPlanRepository,
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository
  ) {}

  /**
   * Execute subscription activation
   * @param input - Subscription activation data
   * @returns ActivateUserSubscriptionResult with subscription details
   */
  async execute(
    input: ActivateUserSubscriptionInput
  ): Promise<ActivateUserSubscriptionResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Verify user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        return {
          success: false,
          error: `User with ID ${input.userId} not found`,
        };
      }

      // 3. Fetch pricing plan configuration
      const pricingPlan = await this.pricingPlanRepository.findByName(
        input.planName
      );
      if (!pricingPlan) {
        return {
          success: false,
          error: `Pricing plan '${input.planName}' not found`,
        };
      }

      if (!pricingPlan.active) {
        return {
          success: false,
          error: `Pricing plan '${input.planName}' is not currently active`,
        };
      }

      // 4. Calculate subscription dates
      const durationMonths = input.durationMonths || 1;
      const startDate = new Date();
      const expiresAt = this.calculateExpirationDate(startDate, durationMonths);

      // 5. Update user subscription
      await this.userRepository.updateSubscription(input.userId, {
        subscriptionPlan: input.planName,
        subscriptionStartedAt: startDate,
        subscriptionExpiresAt: expiresAt,
        maxContacts: pricingPlan.maxContacts,
        maxMonthlyEmails: pricingPlan.maxMonthlyEmails,
      });

      // 6. Create audit trail entry (GDPR compliance)
      await this.subscriptionHistoryRepository.create({
        userId: input.userId,
        changeType: 'reactivation', // Or 'trial_started' for new users
        oldPlan: null, // Could fetch current plan if needed
        newPlan: input.planName,
        oldQuota: null,
        newQuota: {
          maxContacts: pricingPlan.maxContacts,
          maxMonthlyEmails: pricingPlan.maxMonthlyEmails,
        },
        changedByUserId: input.changedBy || null,
        changeReason: input.notes || `Activated ${input.planName} plan for ${durationMonths} month(s)`,
        ipAddress: input.ipAddress || null,
        userAgent: null,
      });

      // 7. Return success result
      return {
        success: true,
        subscription: {
          planName: input.planName,
          maxContacts: pricingPlan.maxContacts,
          maxMonthlyEmails: pricingPlan.maxMonthlyEmails,
          startDate,
          expiresAt,
        },
      };
    } catch (error) {
      console.error('ActivateUserSubscriptionUseCase.execute error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to activate subscription',
      };
    }
  }

  /**
   * Validate input data
   * @param input - Subscription activation data
   * @returns Error message or null if valid
   */
  private validateInput(
    input: ActivateUserSubscriptionInput
  ): string | null {
    if (!input.userId || typeof input.userId !== 'number') {
      return 'User ID is required and must be a number';
    }

    if (!input.planName || typeof input.planName !== 'string') {
      return 'Plan name is required';
    }

    const validPlans: SubscriptionPlanName[] = ['free', 'pro', 'unlimited'];
    if (!validPlans.includes(input.planName)) {
      return `Invalid plan name. Must be one of: ${validPlans.join(', ')}`;
    }

    if (
      input.durationMonths !== undefined &&
      (typeof input.durationMonths !== 'number' || input.durationMonths < 1)
    ) {
      return 'Duration must be a positive number';
    }

    return null;
  }

  /**
   * Calculate subscription expiration date
   * @param startDate - Subscription start date
   * @param durationMonths - Duration in months
   * @returns Expiration date (or undefined for unlimited plans)
   */
  private calculateExpirationDate(
    startDate: Date,
    durationMonths: number
  ): Date | undefined {
    // Unlimited plans don't expire
    // Could be controlled by plan configuration in the future
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    return expiresAt;
  }
}
