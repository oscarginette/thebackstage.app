/**
 * Contact List Single Resource API
 *
 * PATCH  /api/contact-lists/[id] - Update a contact list
 * DELETE /api/contact-lists/[id] - Delete a contact list
 *
 * Multi-tenant isolation enforced via session.user.id
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { UpdateContactListSchema } from '@/lib/validation-schemas';

/**
 * PATCH /api/contact-lists/[id]
 * Update contact list properties (name, description, color)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate list ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid list ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = UpdateContactListSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    const useCase = UseCaseFactory.createUpdateContactListUseCase();
    const list = await useCase.execute({
      userId: parseInt(session.user.id),
      listId: id,
      name: validatedData.name,
      description: validatedData.description,
      color: validatedData.color,
    });

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error('Error updating contact list:', error);

    if (
      error.message.includes('not found') ||
      error.message.includes('access denied')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Handle duplicate name error
    if (
      error.message.includes('duplicate') ||
      error.code === '23505' ||
      error.constraint === 'unique_list_name_per_user'
    ) {
      return NextResponse.json(
        { error: 'A list with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update contact list' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/contact-lists/[id]
 * Delete a contact list (cascade deletes list members)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const useCase = UseCaseFactory.createDeleteContactListUseCase();
    await useCase.execute({
      userId: parseInt(session.user.id),
      listId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact list:', error);

    if (
      error.message.includes('not found') ||
      error.message.includes('access denied')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete contact list' },
      { status: 500 }
    );
  }
}
