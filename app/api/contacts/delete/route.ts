import { NextResponse } from 'next/server';
import { DeleteContactsUseCase, ValidationError } from '@/domain/services/DeleteContactsUseCase';
import { contactRepository } from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contacts/delete
 * Deletes multiple contacts by IDs
 *
 * Clean Architecture: Only HTTP concerns (parsing, error handling, JSON response)
 * Business logic delegated to DeleteContactsUseCase
 */
export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    // Use DeleteContactsUseCase for business logic
    const useCase = new DeleteContactsUseCase(contactRepository);
    const result = await useCase.execute({ ids });

    return NextResponse.json({
      success: result.success,
      deleted: result.deleted,
    });
  } catch (error: any) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle unexpected errors
    console.error('Error deleting contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
