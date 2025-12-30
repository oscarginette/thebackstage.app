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
import { PostgresQuotaTrackingRepository } from '@/infrastructure/database/repositories/PostgresQuotaTrackingRepository';

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Users API] Starting request...');

    // Check authentication
    const session = await auth();
    console.log('[Admin Users API] Session:', session?.user?.email, 'Role:', session?.user?.role);

    if (!session?.user) {
      console.log('[Admin Users API] No session found');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      console.log('[Admin Users API] User is not admin:', session.user.role);
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Get admin user
    const userRepository = new PostgresUserRepository();
    const adminUser = await userRepository.findByEmail(session.user.email!);
    console.log('[Admin Users API] Admin user found:', adminUser?.id);

    if (!adminUser) {
      console.log('[Admin Users API] Admin user not found in database');
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Initialize repositories
    const quotaRepository = new PostgresQuotaTrackingRepository();

    // Execute use case
    const useCase = new GetAllUsersUseCase(userRepository, quotaRepository);
    const users = await useCase.execute(adminUser.id);
    console.log('[Admin Users API] Users fetched:', users.length);

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
