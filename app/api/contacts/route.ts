import { NextResponse } from 'next/server';
import { GetContactsWithStatsUseCase } from '@/domain/services/GetContactsWithStatsUseCase';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contacts
 * Obtiene todos los contactos con estadísticas
 *
 * Clean Architecture: Only HTTP orchestration, no business logic
 */
export async function GET() {
  try {
    const contactRepository = new PostgresContactRepository();
    const useCase = new GetContactsWithStatsUseCase(contactRepository);

    const result = await useCase.execute();

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
