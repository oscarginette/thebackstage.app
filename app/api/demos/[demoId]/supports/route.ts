/**
 * GET /api/demos/[demoId]/supports
 * List all supports for a demo
 *
 * POST /api/demos/[demoId]/supports
 * Record DJ support for a demo
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { RecordDemoSupportUseCase } from '@/domain/services/RecordDemoSupportUseCase';
import {
  demoRepository,
  demoSupportRepository,
  contactRepository,
} from '@/infrastructure/database/repositories';
import { RecordDemoSupportSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/demos/[demoId]/supports
 * Returns all supports for a demo
 */
export async function GET(
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

    // Verify demo ownership
    const demo = await demoRepository.findById(demoId, parseInt(userId));
    if (!demo) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    // Fetch supports
    const supports = await demoSupportRepository.findByDemoId(demoId);

    return NextResponse.json({ supports });
  } catch (error) {
    console.error('Error fetching demo supports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demos/[demoId]/supports
 * Records DJ support for a demo
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
    const validation = RecordDemoSupportSchema.safeParse(body);

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
    const useCase = new RecordDemoSupportUseCase(
      demoRepository,
      demoSupportRepository,
      contactRepository
    );

    const result = await useCase.execute({
      userId: parseInt(userId),
      demoId,
      contactId: validatedData.contactId,
      supportType: validatedData.supportType,
      platform: validatedData.platform,
      eventName: validatedData.eventName,
      playedAt: validatedData.playedAt ? new Date(validatedData.playedAt) : undefined,
      proofUrl: validatedData.proofUrl,
      notes: validatedData.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ support: result.support }, { status: 201 });
  } catch (error) {
    console.error('Error recording demo support:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
