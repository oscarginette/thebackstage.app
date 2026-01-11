/**
 * Add Contacts to List API
 *
 * POST /api/contact-lists/[id]/add-contacts - Add contacts to a list
 *
 * Multi-tenant isolation enforced via session.user.id and use case validation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { AddContactsToListSchema } from '@/lib/validation-schemas';

/**
 * POST /api/contact-lists/[id]/add-contacts
 * Add multiple contacts to a list (bulk operation)
 *
 * Request body: { contactIds: number[] }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = AddContactsToListSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    const useCase = UseCaseFactory.createAddContactsToListUseCase();
    const result = await useCase.execute({
      userId: parseInt(session.user.id),
      listId: id,
      contactIds: validatedData.contactIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding contacts to list:', error);

    if (
      error.message.includes('not found') ||
      error.message.includes('access denied')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('No valid contacts')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add contacts to list' },
      { status: 400 }
    );
  }
}
