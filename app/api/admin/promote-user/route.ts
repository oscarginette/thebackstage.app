/**
 * Promote User to Admin API Route
 *
 * TEMPORARY endpoint for development to promote users to admin role.
 * Should be removed or secured in production.
 *
 * Clean Architecture: Orchestration layer only.
 * Business logic delegated to PromoteUserToAdminUseCase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { UseCaseFactory } from '@/lib/di-container';
import { PromoteUserSchema } from '@/lib/validation-schemas';

/**
 * POST /api/admin/promote-user
 *
 * Promote a user to admin role
 *
 * Request Body:
 * {
 *   email: string,
 *   secret: string  // Must match ADMIN_SECRET env var
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = PromoteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Get expected secret from environment
    const expectedSecret = env.ADMIN_SECRET || 'dev-secret-123';

    // Create use case with injected dependencies
    const useCase = UseCaseFactory.createPromoteUserToAdminUseCase(expectedSecret);

    // Execute use case
    const result = await useCase.execute({
      email: validatedData.email,
      secret: validatedData.secret,
    });

    // Handle result
    if (!result.success) {
      const statusCode =
        result.error === 'Invalid secret' ? 403 :
        result.error === 'User not found' ? 404 :
        result.error === 'Email is required' ? 400 :
        500;

      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { success: true, user: result.user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Promote user API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
