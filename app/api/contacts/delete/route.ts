import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contacts/delete
 * Elimina múltiples contactos por IDs
 */
export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs' },
        { status: 400 }
      );
    }

    // Validar que todos los IDs sean números
    if (!ids.every(id => typeof id === 'number' && id > 0)) {
      return NextResponse.json(
        { error: 'Todos los IDs deben ser números positivos' },
        { status: 400 }
      );
    }

    // Eliminar contactos usando IN con un array de IDs
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await sql.query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount
    });

  } catch (error: any) {
    console.error('Error deleting contacts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
