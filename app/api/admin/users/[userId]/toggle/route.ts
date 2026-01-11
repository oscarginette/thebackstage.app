/**
 * Toggle User Active Status API Route
 *
 * POST /api/admin/users/[userId]/toggle - Activate or deactivate a user account
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { USER_ROLES } from '@/domain/types/user-roles';
import { ToggleUserStatusSchema } from '@/lib/validation-schemas';

export async function POST(
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

    const validation = ToggleUserStatusSchema.safeParse(body);
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
    const useCase = UseCaseFactory.createToggleUserActiveUseCase();

    const result = await useCase.execute({
      adminUserId: parseInt(session.user.id),
      targetUserId,
      active: validatedData.active,
    });

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        active: result.active,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Toggle user active API error:', error);

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
        error.message.includes('must be') ||
        error.message.includes('cannot deactivate')
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
