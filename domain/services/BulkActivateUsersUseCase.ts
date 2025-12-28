/**
 * BulkActivateUsersUseCase
 *
 * Handles bulk subscription activation for multiple users.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Activates subscriptions for multiple users in batch
 * - Reports success/failure for each user
 * - Continues processing even if individual activations fail
 * - Useful for admin operations and migrations
 *
 * Performance: Processes users sequentially to maintain audit trail integrity
 */

import {
  ActivateUserSubscriptionUseCase,
  ActivateUserSubscriptionInput,
} from './ActivateUserSubscriptionUseCase';
import { SubscriptionPlanName } from '../types/subscriptions';

export interface BulkActivateUsersInput {
  userIds: number[];
  planName: SubscriptionPlanName;
  durationMonths?: number; // Default: 1 month
  changedBy?: number; // Admin user ID who activated
  ipAddress?: string;
  notes?: string;
}

export interface BulkActivateUsersResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: Array<{
    userId: number;
    error: string;
  }>;
}

/**
 * BulkActivateUsersUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (bulk activation orchestration)
 * - OCP: Open for extension (easy to add batch processing strategies)
 * - LSP: Delegates to ActivateUserSubscriptionUseCase
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on ActivateUserSubscriptionUseCase abstraction
 */
export class BulkActivateUsersUseCase {
  constructor(
    private readonly activateSubscriptionUseCase: ActivateUserSubscriptionUseCase
  ) {}

  /**
   * Execute bulk subscription activation
   * @param input - Bulk activation data
   * @returns BulkActivateUsersResult with success/failure counts
   */
  async execute(
    input: BulkActivateUsersInput
  ): Promise<BulkActivateUsersResult> {
    // Validate input
    const validationError = this.validateInput(input);
    if (validationError) {
      return {
        success: false,
        successCount: 0,
        failedCount: 0,
        errors: [{ userId: 0, error: validationError }],
      };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ userId: number; error: string }> = [];

    // Process each user sequentially
    // Using sequential processing to:
    // 1. Maintain audit trail integrity
    // 2. Prevent database connection pool exhaustion
    // 3. Make errors easier to track and debug
    for (const userId of input.userIds) {
      try {
        const activationInput: ActivateUserSubscriptionInput = {
          userId,
          planName: input.planName,
          durationMonths: input.durationMonths,
          changedBy: input.changedBy,
          ipAddress: input.ipAddress,
          notes: input.notes,
        };

        const result =
          await this.activateSubscriptionUseCase.execute(activationInput);

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            userId,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          userId,
          error:
            error instanceof Error
              ? error.message
              : 'Unexpected error during activation',
        });
      }
    }

    return {
      success: successCount > 0 && failedCount === 0,
      successCount,
      failedCount,
      errors,
    };
  }

  /**
   * Validate bulk activation input
   * @param input - Bulk activation data
   * @returns Error message or null if valid
   */
  private validateInput(input: BulkActivateUsersInput): string | null {
    if (!input.userIds || !Array.isArray(input.userIds)) {
      return 'User IDs must be an array';
    }

    if (input.userIds.length === 0) {
      return 'At least one user ID is required';
    }

    // Check for duplicate user IDs
    const uniqueIds = new Set(input.userIds);
    if (uniqueIds.size !== input.userIds.length) {
      return 'Duplicate user IDs are not allowed';
    }

    // Validate all user IDs are numbers
    const invalidIds = input.userIds.filter(
      (id) => typeof id !== 'number' || id <= 0
    );
    if (invalidIds.length > 0) {
      return 'All user IDs must be positive numbers';
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

    // Reasonable limit to prevent accidental bulk operations
    if (input.userIds.length > 1000) {
      return 'Cannot activate more than 1000 users at once. Please split into smaller batches.';
    }

    return null;
  }
}
