/**
 * DeleteUsersUseCase
 *
 * Handles bulk deletion of users by IDs.
 * Clean Architecture: Business logic in domain layer.
 * SOLID:
 *   - Single Responsibility: Only handles user deletion orchestration
 *   - Dependency Inversion: Depends on IUserRepository interface
 *
 * Authorization: Only admin users can delete users.
 * Business Rules:
 *   - Cannot delete admin users (prevent accidental admin lockout)
 *   - IDs must be valid positive integers
 *   - Requesting user must have admin role
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ValidationError } from '../errors/ValidationError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { USER_ROLES, type UserRole } from '../types/user-roles';

export interface DeleteUsersInput {
  /** IDs of users to delete */
  ids: number[];
  /** Role of the requesting user (for authorization) */
  requestingUserRole: UserRole;
}

export interface DeleteUsersResult {
  success: boolean;
  deleted: number;
  message: string;
}

export class DeleteUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeleteUsersInput): Promise<DeleteUsersResult> {
    // 1. Validate requesting user is admin
    this.validateAuthorization(input.requestingUserRole);

    // 2. Validate input
    this.validateInput(input);

    // 3. Check for admin users in deletion list
    await this.validateNoAdminDeletion(input.ids);

    // 4. Delete users via repository
    const deleted = await this.userRepository.deleteBulk(input.ids);

    // 5. Return result
    return {
      success: true,
      deleted,
      message: `Successfully deleted ${deleted} user${deleted !== 1 ? 's' : ''}`,
    };
  }

  /**
   * Validate requesting user has admin role
   * Business rule: Only admins can delete users
   */
  private validateAuthorization(role: UserRole): void {
    if (role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError('Admin access required');
    }
  }

  /**
   * Validate deletion input
   * Business rule: IDs array must not be empty and all IDs must be positive integers
   */
  private validateInput(input: DeleteUsersInput): void {
    if (!input.ids || !Array.isArray(input.ids)) {
      throw new ValidationError('IDs must be an array');
    }

    if (input.ids.length === 0) {
      throw new ValidationError('IDs array cannot be empty');
    }

    // Validate each ID is a positive integer
    for (const id of input.ids) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError(
          `All IDs must be positive integers (invalid ID: ${id})`
        );
      }
    }
  }

  /**
   * Validate no admin users are in deletion list
   * Business rule: Cannot delete admin users to prevent accidental lockout
   */
  private async validateNoAdminDeletion(ids: number[]): Promise<void> {
    const adminUsers = await this.userRepository.findAdminsByIds(ids);

    if (adminUsers.length > 0) {
      const adminEmails = adminUsers.map((user: { email: string }) => user.email).join(', ');
      throw new ValidationError(`Cannot delete admin users: ${adminEmails}`);
    }
  }
}
