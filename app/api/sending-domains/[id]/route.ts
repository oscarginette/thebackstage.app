/**
 * DELETE /api/sending-domains/[id]
 *
 * Deletes a sending domain after verifying ownership.
 * Clean Architecture: Only HTTP orchestration, no business logic.
 *
 * USAGE:
 * DELETE /api/sending-domains/123
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/sending-domains/[id]
 * Delete a sending domain
 *
 * Verifies ownership before deletion. Removes from both database and Mailgun.
 *
 * Response (success):
 * {
 *   success: true
 * }
 *
 * Response (error):
 * {
 *   error: "Domain not found" | "Unauthorized" | ...
 * }
 */
export async function DELETE(
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

    // Execute Use Case (business logic with ownership check)
    const useCase = UseCaseFactory.createDeleteSendingDomainUseCase();
    const result = await useCase.execute({
      domainId,
      userId: Number(session.user.id),
    });

    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.error === 'Unauthorized' ? 403 : 400;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/sending-domains/[id]] Error:', error);

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
