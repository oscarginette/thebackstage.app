/**
 * POST /api/sending-domains/[id]/verify
 *
 * Verifies DNS configuration for a sending domain via Mailgun.
 * Clean Architecture: Only HTTP orchestration, no business logic.
 *
 * USAGE:
 * POST /api/sending-domains/123/verify
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { AccessDeniedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sending-domains/[id]/verify
 * Verify domain DNS configuration
 *
 * Checks with Mailgun whether SPF, DKIM, and DMARC records are properly configured.
 * Updates domain status to 'verified' if all records pass.
 *
 * Response (success):
 * {
 *   success: true,
 *   status: "verified",
 *   domain: {
 *     id: 1,
 *     domain: "geebeat.com",
 *     status: "verified",
 *     verifiedAt: "2024-01-15T10:30:00Z",
 *     ...
 *   }
 * }
 *
 * Response (failed verification):
 * {
 *   success: false,
 *   status: "failed",
 *   error: "DNS records not verified",
 *   domain: {
 *     id: 1,
 *     domain: "geebeat.com",
 *     status: "failed",
 *     errorMessage: "SPF record not found",
 *     ...
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15)
    const resolvedParams = await params;

    // Parse and validate domain ID
    const domainId = parseInt(resolvedParams.id, 10);
    if (isNaN(domainId)) {
      return NextResponse.json(
        { error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    // Execute Use Case (business logic)
    const useCase = UseCaseFactory.createVerifySendingDomainUseCase();
    const result = await useCase.execute({
      domainId,
      userId: parseInt(session.user.id, 10),
    });

    // Return result regardless of verification success
    // (client should check 'success' field)
    return NextResponse.json({
      success: result.success,
      status: result.status,
      domain: result.domain?.toJSON(),
      error: result.error,
    });
  } catch (error) {
    console.error('[POST /api/sending-domains/[id]/verify] Error:', error);

    // Handle ownership/permission errors (403 Forbidden)
    if (error instanceof AccessDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
