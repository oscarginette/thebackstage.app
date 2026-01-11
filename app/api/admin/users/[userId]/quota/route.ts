/**
 * Update User Quota API Route
 *
 * PATCH /api/admin/users/[userId]/quota - Update a user's monthly email quota limit
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { USER_ROLES } from '@/domain/types/user-roles';
import { UpdateUserQuotaSchema } from '@/lib/validation-schemas';

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
    if (session.user.role !== USER_ROLES.ADMIN) {
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

    // Parse and validate request body
    const body = await request.json();

    const validation = UpdateUserQuotaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Execute use case
    const useCase = UseCaseFactory.createUpdateUserQuotaUseCase();

    const result = await useCase.execute({
      adminUserId: parseInt(session.user.id),
      targetUserId,
      monthlyQuota: validatedData.monthlyQuota,
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
