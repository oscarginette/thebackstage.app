/**
 * BulkActivateUsersUseCase
 *
 * Admin use case to bulk activate user subscriptions.
 * Activates multiple users with a specific plan and duration.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UnauthorizedError } from './GetAllUsersUseCase';
import { UpdateSubscriptionInput } from '@/domain/types/subscriptions';

export interface BulkActivateUsersInput {
  adminUserId: number;
  userIds: number[];
  planName: string;
  durationMonths: number;
}

export interface BulkActivateUsersResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: Array<{ userId: number; error: string }>;
}

export class BulkActivateUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: BulkActivateUsersInput): Promise<BulkActivateUsersResult> {
    // Validate input
    this.validateInput(input);

    // Verify admin user
    const adminUser = await this.userRepository.findById(input.adminUserId);

    if (!adminUser) {
      throw new UnauthorizedError('Admin user not found');
    }

    if (!adminUser.isAdmin()) {
      throw new UnauthorizedError('Admin access required');
    }

    // Process bulk activation
    const errors: Array<{ userId: number; error: string }> = [];
    let successCount = 0;

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + input.durationMonths);

    for (const userId of input.userIds) {
      try {
        const user = await this.userRepository.findById(userId);

        if (!user) {
          errors.push({ userId, error: 'User not found' });
          continue;
        }

        // Get quota limits based on plan
        const quotaLimits = this.getQuotaLimitsForPlan(input.planName);

        const subscriptionInput: UpdateSubscriptionInput = {
          subscriptionPlan: input.planName as 'free' | 'pro' | 'business' | 'unlimited',
          subscriptionStartedAt: startDate,
          subscriptionExpiresAt: expiresAt,
          maxContacts: quotaLimits.maxContacts,
          maxMonthlyEmails: quotaLimits.maxMonthlyEmails,
        };

        await this.userRepository.updateSubscription(userId, subscriptionInput);

        successCount++;
      } catch (error: any) {
        errors.push({
          userId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      success: true,
      successCount,
      failedCount: errors.length,
      errors,
    };
  }

  private validateInput(input: BulkActivateUsersInput): void {
    if (!input.adminUserId || input.adminUserId <= 0) {
      throw new Error('Invalid adminUserId');
    }

    if (!input.userIds || !Array.isArray(input.userIds) || input.userIds.length === 0) {
      throw new Error('userIds must be a non-empty array');
    }

    if (input.userIds.some((id) => !id || id <= 0)) {
      throw new Error('All userIds must be positive integers');
    }

    const validPlans = ['free', 'pro', 'business', 'unlimited'];
    if (!validPlans.includes(input.planName.toLowerCase())) {
      throw new Error(`Invalid planName. Must be one of: ${validPlans.join(', ')}`);
    }

    if (!input.durationMonths || input.durationMonths <= 0 || input.durationMonths > 120) {
      throw new Error('durationMonths must be between 1 and 120');
    }
  }

  /**
   * Get quota limits for a subscription plan
   * Hardcoded based on pricing_plans table schema
   */
  private getQuotaLimitsForPlan(planName: string): {
    maxContacts: number;
    maxMonthlyEmails: number;
  } {
    const plan = planName.toLowerCase();

    switch (plan) {
      case 'free':
        return { maxContacts: 100, maxMonthlyEmails: 500 };
      case 'pro':
        return { maxContacts: 1000, maxMonthlyEmails: 5000 };
      case 'business':
        return { maxContacts: 5000, maxMonthlyEmails: 25000 };
      case 'unlimited':
        return { maxContacts: 10000, maxMonthlyEmails: 999999999 }; // Effectively unlimited
      default:
        return { maxContacts: 100, maxMonthlyEmails: 500 };
    }
  }
}
