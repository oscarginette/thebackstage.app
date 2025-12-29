/**
 * Bulk Activate Users API Route
 *
 * POST /api/admin/users/bulk-activate - Activate subscription plans for multiple users
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BulkActivateUsersUseCase } from '@/domain/services/admin/BulkActivateUsersUseCase';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { User } from '@/domain/entities/User';

interface BulkActivateRequest {
  userIds: number[];
  plan: 'free' | 'pro' | 'business' | 'unlimited';
  durationMonths: number;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: BulkActivateRequest = await request.json();

    // Validate input
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.plan || !['free', 'pro', 'business', 'unlimited'].includes(body.plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be one of: free, pro, business, unlimited' },
        { status: 400 }
      );
    }

    if (!body.durationMonths || body.durationMonths < 1 || body.durationMonths > 12) {
      return NextResponse.json(
        { error: 'durationMonths must be between 1 and 12' },
        { status: 400 }
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

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Execute use case
    const useCase = new BulkActivateUsersUseCase(userRepository);

    const result = await useCase.execute({
      adminUserId: adminUser.id,
      userIds: body.userIds,
      planName: body.plan,
      durationMonths: body.durationMonths,
    });

    return NextResponse.json(
      {
        success: true,
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk activate users API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
