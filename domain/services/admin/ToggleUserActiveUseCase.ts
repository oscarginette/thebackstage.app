/**
 * ToggleUserActiveUseCase
 *
 * Admin use case to activate or deactivate a user account.
 * SECURITY: Must be called only by authenticated admin users.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UnauthorizedError } from '@/lib/errors';

export interface ToggleUserActiveInput {
  adminUserId: number;
  targetUserId: number;
  active: boolean;
}

export interface ToggleUserActiveResult {
  success: boolean;
  userId: number;
  active: boolean;
}

export class ToggleUserActiveUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ToggleUserActiveInput): Promise<ToggleUserActiveResult> {
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

    // Prevent admin from deactivating themselves
    if (input.adminUserId === input.targetUserId && !input.active) {
      throw new Error('Admins cannot deactivate their own account');
    }

    // Update active status
    await this.userRepository.updateActiveStatus(
      input.targetUserId,
      input.active
    );

    return {
      success: true,
      userId: input.targetUserId,
      active: input.active,
    };
  }

  private validateInput(input: ToggleUserActiveInput): void {
    if (!input.adminUserId || input.adminUserId <= 0) {
      throw new Error('Invalid adminUserId');
    }

    if (!input.targetUserId || input.targetUserId <= 0) {
      throw new Error('Invalid targetUserId');
    }

    if (typeof input.active !== 'boolean') {
      throw new Error('Active must be a boolean value');
    }
  }
}
