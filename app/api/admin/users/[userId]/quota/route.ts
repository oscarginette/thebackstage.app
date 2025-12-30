/**
 * Update User Quota API Route
 *
 * PATCH /api/admin/users/[userId]/quota - Update a user's monthly email quota limit
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UpdateUserQuotaUseCase } from '@/domain/services/admin/UpdateUserQuotaUseCase';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { UnauthorizedError } from '@/domain/services/admin/GetAllUsersUseCase';

interface UpdateQuotaRequest {
  monthlyQuota: number;
}

async function handleQuotaUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { userId } = await params;

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

    // Parse userId from params
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { error: 'Invalid userId parameter' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: UpdateQuotaRequest = await request.json();

    // Validate monthlyQuota
    if (
      body.monthlyQuota === undefined ||
      typeof body.monthlyQuota !== 'number' ||
      body.monthlyQuota < 0
    ) {
      return NextResponse.json(
        { error: 'monthlyQuota must be a non-negative number' },
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

    // Execute use case
    const useCase = new UpdateUserQuotaUseCase(userRepository);

    const result = await useCase.execute({
      adminUserId: adminUser.id,
      targetUserId,
      monthlyQuota: body.monthlyQuota,
    });

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        monthlyQuota: result.monthlyQuota,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user quota API error:', error);

    // Handle specific error types
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error) {
      // Handle "User not found" errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Handle validation errors
      if (
        error.message.includes('Invalid') ||
        error.message.includes('must be')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support both PATCH and PUT methods
export const PATCH = handleQuotaUpdate;
export const PUT = handleQuotaUpdate;
