/**
 * GET /api/email-signature - Get user's email signature
 * PUT /api/email-signature - Update user's email signature
 * DELETE /api/email-signature - Delete user's signature (revert to default)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory, RepositoryFactory } from '@/lib/di-container';
import { EmailSignatureSchema } from '@/lib/validation-schemas';
import { z } from 'zod';

// GET - Retrieve signature
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const useCase = UseCaseFactory.createGetUserEmailSignatureUseCase();

    const signature = await useCase.execute(userId);

    return NextResponse.json({ signature: signature.toJSON() });
  } catch (error) {
    console.error('Get email signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update signature
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const body = await request.json();

    // Validate input
    const validationResult = EmailSignatureSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const useCase = UseCaseFactory.createUpdateEmailSignatureUseCase();

    await useCase.execute({
      userId,
      signatureData: validatedData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.format() },
        { status: 400 }
      );
    }
    console.error('Update email signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove signature
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const repository = RepositoryFactory.createEmailSignatureRepository();
    await repository.delete(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete email signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
