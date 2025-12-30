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
    console.log('[GetAllUsersUseCase] Starting execution for admin:', adminUserId);

    // Verify admin user
    const adminUser = await this.userRepository.findById(adminUserId);
    console.log('[GetAllUsersUseCase] Admin user:', adminUser?.email, 'isAdmin:', adminUser?.isAdmin());

    if (!adminUser) {
      console.log('[GetAllUsersUseCase] Admin user not found');
      throw new UnauthorizedError('User not found');
    }

    if (!adminUser.isAdmin()) {
      console.log('[GetAllUsersUseCase] User is not admin');
      throw new UnauthorizedError('Admin access required');
    }

    // Get all users
    const users = await this.userRepository.findAll();
    console.log('[GetAllUsersUseCase] Found users:', users.length);

    // Enrich with quota data
    const usersWithQuota = await Promise.all(
      users.map(async (user) => {
        const quota = await this.quotaRepository.getByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStartedAt: user.subscriptionStartedAt,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          maxMonthlyEmails: user.maxMonthlyEmails,
          quota: quota
            ? {
                emailsSent: quota.emailsSentToday,
                monthlyLimit: quota.monthlyLimit,
                remaining: quota.getRemainingQuota(),
                lastReset: quota.lastResetDate,
              }
            : null,
        };
      })
    );

    return usersWithQuota;
  }
}
