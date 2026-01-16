/**
 * POST /api/gate/[slug]/submit
 * Submit email for download gate (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { SubmitDownloadGateSchema } from '@/lib/validation-schemas';
import {
  GateNotFoundError,
  GateInactiveError,
  GateExpiredError,
  DuplicateSubmissionError,
} from '@/domain/errors/DownloadGateErrors';
import { ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gate/[slug]/submit
 * Submit email and create download submission
 * consentMarketing=true means user accepts ALL brands (Backstage + Gee Beat + Artist)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Parse and validate request body
    const body = await request.json();

    const validation = SubmitDownloadGateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, firstName, consentMarketing } = validation.data;

    // Extract IP and user agent for GDPR compliance
    const ipAddress = request.headers.get('x-forwarded-for') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Initialize use case
    const processDownloadGateUseCase = UseCaseFactory.createProcessDownloadGateUseCase();

    // Execute
    const result = await processDownloadGateUseCase.execute({
      gateSlug: slug,
      email,
      firstName,
      consentMarketing,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: result.success,
        submissionId: result.submissionId,
        requiresVerification: result.requiresVerification,
        verificationsSent: result.verificationsSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/gate/[slug]/submit error:', error);

    // Domain error handling
    if (error instanceof GateNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof GateInactiveError || error instanceof GateExpiredError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof DuplicateSubmissionError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
