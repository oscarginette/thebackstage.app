/**
 * POST /api/gate/[slug]/download-token
 * Generate download token for a submission (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { GenerateDownloadTokenUseCase } from '@/domain/services/GenerateDownloadTokenUseCase';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';

// Singleton repository instances
const submissionRepository = new PostgresDownloadSubmissionRepository();
const gateRepository = new PostgresDownloadGateRepository();

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

    // Parse request body
    const body = await request.json();
    const { submissionId } = body;

    // Validate required fields
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Initialize use case
    const generateTokenUseCase = new GenerateDownloadTokenUseCase(
      submissionRepository,
      gateRepository
    );

    // Execute
    const result = await generateTokenUseCase.execute({
      submissionId: parseInt(submissionId),
    });

    if (!result.success) {
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

    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('POST /api/gate/[slug]/download-token error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
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
