/**
 * Admin Users API Route
 *
 * GET /api/admin/users - Fetch all users with quota information
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetAllUsersUseCase } from '@/domain/services/admin/GetAllUsersUseCase';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Get admin user
    const userRepository = new PostgresUserRepository();
    const adminUser = await userRepository.findByEmail(session.user.email!);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Execute use case
    const useCase = new GetAllUsersUseCase(userRepository);
    const users = await useCase.execute(adminUser.id);

    return NextResponse.json(
      {
        success: true,
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStartedAt: user.subscriptionStartedAt,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          monthlyQuota: user.maxMonthlyEmails,
          quota: user.quota
            ? {
                emailsSentToday: user.quota.emailsSent,
                monthlyLimit: user.quota.monthlyLimit,
                remaining: user.quota.remaining,
                lastResetDate: user.quota.lastReset,
              }
            : null,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get all users API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
