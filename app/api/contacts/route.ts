import { NextResponse } from 'next/server';
import { GetContactsWithStatsUseCase } from '@/domain/services/GetContactsWithStatsUseCase';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contacts
 * Obtiene todos los contactos con estadísticas del usuario autenticado
 *
 * Clean Architecture: Only HTTP orchestration, no business logic
 * Multi-tenant: Returns only contacts belonging to authenticated user
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    const contactRepository = new PostgresContactRepository();
    const useCase = new GetContactsWithStatsUseCase(contactRepository);

    const result = await useCase.execute(userId);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
