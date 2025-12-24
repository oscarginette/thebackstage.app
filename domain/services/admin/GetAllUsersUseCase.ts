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
import { IQuotaTrackingRepository } from '@/domain/repositories/IQuotaTrackingRepository';

export interface UserWithQuota {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'artist';
  active: boolean;
  createdAt: Date;
  quota: {
    emailsSentToday: number;
    monthlyLimit: number;
    remaining: number;
    lastResetDate: Date;
  } | null;
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly quotaRepository: IQuotaTrackingRepository
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

    // Enrich with quota data
    const usersWithQuota = await Promise.all(
      users.map(async (user) => {
        const quota = await this.quotaRepository.getByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          quota: quota
            ? {
                emailsSentToday: quota.emailsSentToday,
                monthlyLimit: quota.monthlyLimit,
                remaining: quota.getRemainingQuota(),
                lastResetDate: quota.lastResetDate,
              }
            : null,
        };
      })
    );

    return usersWithQuota;
  }
}
