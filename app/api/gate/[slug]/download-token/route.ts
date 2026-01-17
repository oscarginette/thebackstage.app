/**
 * POST /api/gate/[slug]/download-token
 * Generate download token for a submission (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gate/[slug]/download-token
 * Generate download token when all verifications are complete
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('[POST /api/gate/[slug]/download-token] Request received:', { slug });

    // Parse request body
    const body = await request.json();
    const { submissionId } = body;

    console.log('[POST /api/gate/[slug]/download-token] Request body:', { submissionId });

    // Validate required fields
    if (!submissionId) {
      console.error('[POST /api/gate/[slug]/download-token] Missing submissionId');
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Initialize use case
    const generateTokenUseCase = UseCaseFactory.createGenerateDownloadTokenUseCase();

    console.log('[POST /api/gate/[slug]/download-token] Executing use case...');

    // Execute
    const result = await generateTokenUseCase.execute({
      submissionId,
    });

    console.log('[POST /api/gate/[slug]/download-token] Use case result:', {
      success: result.success,
      hasToken: !!result.token,
      error: result.error,
    });

    if (!result.success) {
      console.error('[POST /api/gate/[slug]/download-token] Use case failed:', result.error);

      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('[POST /api/gate/[slug]/download-token] Success! Returning token');

    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('POST /api/gate/[slug]/download-token error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
