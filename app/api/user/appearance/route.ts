import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { Theme } from '@/domain/types/appearance';
import { UpdateUserAppearanceSchema } from '@/lib/validation-schemas';

/**
 * PATCH /api/user/appearance
 *
 * Update user's theme preference.
 * Presentation layer: ONLY orchestration, NO business logic.
 *
 * Clean Architecture:
 * - API route is presentation layer
 * - Only handles HTTP concerns (auth, request/response)
 * - Delegates business logic to Use Case
 *
 * USAGE:
 * ```typescript
 * fetch('/api/user/appearance', {
 *   method: 'PATCH',
 *   body: JSON.stringify({ theme: 'dark' })
 * })
 * ```
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();

    const validation = UpdateUserAppearanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { theme } = validation.data;

    // Execute Use Case (business logic)
    const updateAppearanceUseCase = UseCaseFactory.createUpdateUserAppearanceUseCase();

    const result = await updateAppearanceUseCase.execute({
      userId: Number(session.user.id),
      theme: theme as Theme,
    });

    return NextResponse.json({
      success: result.success,
      theme: result.appearance.theme,
    });
  } catch (error) {
    console.error('Error updating appearance:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/appearance
 *
 * Get user's theme preference.
 *
 * USAGE:
 * ```typescript
 * const response = await fetch('/api/user/appearance');
 * const data = await response.json();
 * console.log(data.theme); // 'light' | 'dark' | 'system'
 * ```
 */
export async function GET() {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute Use Case
    const getAppearanceUseCase = UseCaseFactory.createGetUserAppearanceUseCase();

    const appearance = await getAppearanceUseCase.execute(
      Number(session.user.id)
    );

    return NextResponse.json({
      theme: appearance.theme,
      updatedAt: appearance.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching appearance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
