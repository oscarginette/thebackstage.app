/**
 * POST /api/gate/[slug]/submit
 * Submit email for download gate (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { SubmitEmailUseCase } from '@/domain/services/SubmitEmailUseCase';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { serializeSubmission } from '@/lib/serialization';

// Singleton repository instances
const gateRepository = new PostgresDownloadGateRepository();
const submissionRepository = new PostgresDownloadSubmissionRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();
const contactRepository = new PostgresContactRepository();

export const dynamic = 'force-dynamic';

/**
 * POST /api/gate/[slug]/submit
 * Submit email and create download submission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Parse request body
    const body = await request.json();
    const { email, firstName, consentMarketing } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (consentMarketing === undefined || consentMarketing === null) {
      return NextResponse.json(
        { error: 'Marketing consent is required' },
        { status: 400 }
      );
    }

    // Extract IP and user agent for GDPR compliance
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Initialize use case
    const submitEmailUseCase = new SubmitEmailUseCase(
      gateRepository,
      submissionRepository,
      analyticsRepository,
      contactRepository
    );

    // Execute
    const result = await submitEmailUseCase.execute({
      gateSlug: slug,
      email,
      firstName,
      consentMarketing,
      ipAddress,
      userAgent,
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

    // Serialize submission
    const serializedSubmission = serializeSubmission(result.submission!);

    return NextResponse.json(
      { submission: serializedSubmission },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/gate/[slug]/submit error:', error);

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
