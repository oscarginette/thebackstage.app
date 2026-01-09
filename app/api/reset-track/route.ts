/**
 * Reset Track API Route
 *
 * Admin endpoint to delete test tracks matching a pattern.
 * Used for cleaning up test data.
 *
 * SECURITY: This should be protected with admin authentication in production.
 * Clean Architecture: API route orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reset-track
 *
 * Deletes tracks with titles matching '%Kamiel%'
 *
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   deletedCount?: number
 * }
 */
export async function GET() {
  try {
    const useCase = UseCaseFactory.createDeleteTracksByPatternUseCase();
    const result = await useCase.execute({
      titlePattern: '%Kamiel%',
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Reset track error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
