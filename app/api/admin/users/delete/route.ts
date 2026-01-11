/**
 * Admin Delete Users API Route
 *
 * POST /api/admin/users/delete - Delete multiple users by IDs
 *
 * Admin-only endpoint for bulk user deletion
 * Clean Architecture: API route only orchestrates, business logic in DeleteUsersUseCase
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { ValidationError } from '@/domain/errors/ValidationError';
import { ForbiddenError } from '@/domain/errors/ForbiddenError';
import { DeleteUsersSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = DeleteUsersSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { ids } = validation.data;

    // 3. Execute use case
    const useCase = UseCaseFactory.createDeleteUsersUseCase();
    const result = await useCase.execute({
      ids,
      requestingUserRole: session.user.role,
    });

    // 4. Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Delete users API error:', error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
