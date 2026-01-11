/**
 * Bulk Activate Users API Route
 *
 * POST /api/admin/users/bulk-activate - Activate subscription plans for multiple users
 *
 * Clean Architecture: API route -> Use Case -> Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { USER_ROLES } from '@/domain/types/user-roles';
import { SubscriptionPlanName } from '@/domain/types/subscriptions';
import { BulkActivateUsersSchema } from '@/lib/validation-schemas';

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
    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    const validation = BulkActivateUsersSchema.safeParse(body);
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
    const useCase = UseCaseFactory.createBulkActivateUsersUseCase();

    const result = await useCase.execute({
      changedBy: parseInt(session.user.id),
      userIds: validatedData.userIds,
      planName: validatedData.plan as SubscriptionPlanName,
      durationMonths: validatedData.durationMonths,
    });

    return NextResponse.json(
      {
        success: true,
        activatedCount: result.successCount,
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
