/**
 * UpdateUserQuotaUseCase
 *
 * Admin use case to update a user's monthly quota limit.
 * SECURITY: Must be called only by authenticated admin users.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UnauthorizedError } from '@/lib/errors';

export interface UpdateUserQuotaInput {
  adminUserId: number;
  targetUserId: number;
  monthlyQuota: number;
}

export interface UpdateUserQuotaResult {
  success: boolean;
  userId: number;
  monthlyQuota: number;
}

export class UpdateUserQuotaUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserQuotaInput): Promise<UpdateUserQuotaResult> {
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

    // Verify target user exists
    const targetUser = await this.userRepository.findById(input.targetUserId);

    if (!targetUser) {
      throw new Error(`User ${input.targetUserId} not found`);
    }

    // Update quota
    await this.userRepository.updateQuota(
      input.targetUserId,
      input.monthlyQuota
    );

    return {
      success: true,
      userId: input.targetUserId,
      monthlyQuota: input.monthlyQuota,
    };
  }

  private validateInput(input: UpdateUserQuotaInput): void {
    if (!input.adminUserId || input.adminUserId <= 0) {
      throw new Error('Invalid adminUserId');
    }

    if (!input.targetUserId || input.targetUserId <= 0) {
      throw new Error('Invalid targetUserId');
    }

    if (
      input.monthlyQuota < 0 ||
      input.monthlyQuota > 999999999
    ) {
      throw new Error('Monthly quota must be between 0 and 999,999,999');
    }
  }
}
