/**
 * GET /api/demos/[demoId]
 * Get demo details
 *
 * PATCH /api/demos/[demoId]
 * Update demo
 *
 * DELETE /api/demos/[demoId]
 * Delete demo (soft delete)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { demoRepository } from '@/infrastructure/database/repositories';
import { UpdateDemoSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/demos/[demoId]
 * Returns demo details for authenticated user
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

    // Fetch demo
    const demo = await demoRepository.findById(demoId, parseInt(userId));

    if (!demo) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ demo });
  } catch (error) {
    console.error('Error fetching demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demos/[demoId]
 * Updates an existing demo
 */
export async function PATCH(
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
    const validation = UpdateDemoSchema.safeParse(body);

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

    // Convert releaseDate string to Date if provided
    const updateData = {
      ...validatedData,
      releaseDate: validatedData.releaseDate ? new Date(validatedData.releaseDate) : undefined,
    };

    // Update demo
    const demo = await demoRepository.update(demoId, parseInt(userId), updateData);

    if (!demo) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ demo });
  } catch (error) {
    console.error('Error updating demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demos/[demoId]
 * Soft deletes a demo (sets active = false)
 */
export async function DELETE(
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

    // Delete demo (soft delete)
    await demoRepository.delete(demoId, parseInt(userId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting demo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
