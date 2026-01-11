/**
 * GET /api/demos
 * List user's demos
 *
 * POST /api/demos
 * Create new demo
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CreateDemoUseCase } from '@/domain/services/CreateDemoUseCase';
import { demoRepository } from '@/infrastructure/database/repositories';
import { CreateDemoSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/demos
 * Returns all demos for authenticated user
 * Query params:
 * - active=true: Filter for active demos only
 */
export async function GET(request: NextRequest) {
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

    // Check query params
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Fetch demos
    const demos = activeOnly
      ? await demoRepository.findActiveByUserId(parseInt(userId))
      : await demoRepository.findByUserId(parseInt(userId));

    return NextResponse.json({ demos });
  } catch (error) {
    console.error('Error fetching demos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demos
 * Creates a new demo
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateDemoSchema.safeParse(body);

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
    const useCase = new CreateDemoUseCase(demoRepository);
    const result = await useCase.execute({
      userId: parseInt(userId),
      title: validatedData.title,
      artistName: validatedData.artistName,
      fileUrl: validatedData.fileUrl,
      genre: validatedData.genre,
      bpm: validatedData.bpm,
      key: validatedData.key,
      releaseDate: validatedData.releaseDate ? new Date(validatedData.releaseDate) : undefined,
      notes: validatedData.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ demo: result.demo }, { status: 201 });
  } catch (error) {
    console.error('Error creating demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
