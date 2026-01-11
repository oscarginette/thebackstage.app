/**
 * GetAllUsersUseCase
 *
 * Admin use case to retrieve all users with quota statistics.
 * SECURITY: Must be called only by authenticated admin users.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UnauthorizedError } from '@/lib/errors';

export interface UserWithQuota {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'artist';
  active: boolean;
  createdAt: Date;
  subscriptionPlan: string;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  maxMonthlyEmails: number;
  quota: {
    emailsSent: number;
    monthlyLimit: number;
    remaining: number;
    lastReset: Date;
  } | null;
}

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(adminUserId: number): Promise<UserWithQuota[]> {
    // Verify admin user
    const adminUser = await this.userRepository.findById(adminUserId);

    if (!adminUser) {
      throw new UnauthorizedError('User not found');
    }

    if (!adminUser.isAdmin()) {
      throw new UnauthorizedError('Admin access required');
    }

    // Get all users
    const users = await this.userRepository.findAll();

    // Map users with quota data (quota is directly in User entity)
    const usersWithQuota = users.map((user) => {
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStartedAt: user.subscriptionStartedAt ?? null,
        subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
        maxMonthlyEmails: user.maxMonthlyEmails,
        quota: {
          emailsSent: user.emailsSentThisMonth,
          monthlyLimit: user.maxMonthlyEmails,
          remaining: user.maxMonthlyEmails - user.emailsSentThisMonth,
          lastReset: user.quotaResetAt,
        },
      };
    });

    return usersWithQuota;
  }
}
