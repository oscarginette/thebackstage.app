/**
 * Add Contacts to Multiple Lists API
 *
 * POST /api/contacts/add-to-lists - Add contacts to multiple lists simultaneously
 *
 * Multi-tenant isolation enforced via session.user.id and use case validation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { AddContactsToMultipleListsSchema } from '@/lib/validation-schemas';

/**
 * POST /api/contacts/add-to-lists
 * Add contacts to multiple lists (bulk operation)
 *
 * Request body: {
 *   contactIds: number[],
 *   listIds: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = AddContactsToMultipleListsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    const useCase = UseCaseFactory.createAddContactsToMultipleListsUseCase();

    const result = await useCase.execute({
      userId: parseInt(session.user.id),
      listIds: validatedData.listIds,
      contactIds: validatedData.contactIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding contacts to lists:', error);

    if (error.message.includes('No valid contacts')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add contacts to lists' },
      { status: 400 }
    );
  }
}
