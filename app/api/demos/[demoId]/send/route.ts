/**
 * POST /api/demos/[demoId]/send
 * Send demo to DJ contacts
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SendDemoUseCase } from '@/domain/services/SendDemoUseCase';
import {
  demoRepository,
  demoSendRepository,
  contactRepository,
} from '@/infrastructure/database/repositories';
import { resendEmailProvider } from '@/infrastructure/email';
import { SendDemoSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/demos/[demoId]/send
 * Sends demo to specified DJ contacts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ demoId: string }> }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { demoId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = SendDemoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Execute use case
    const useCase = new SendDemoUseCase(
      demoRepository,
      demoSendRepository,
      contactRepository,
      resendEmailProvider
    );

    const result = await useCase.execute({
      userId: parseInt(userId),
      demoId,
      contactIds: validatedData.contactIds,
      emailSubject: validatedData.emailSubject,
      emailBodyHtml: validatedData.emailBodyHtml,
      personalNote: validatedData.personalNote,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      totalSent: result.totalSent,
      totalSkipped: result.totalSkipped,
      sentTo: result.sentTo,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Error sending demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
