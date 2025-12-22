import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contacts
 * Obtiene todos los contactos con estadísticas
 */
export async function GET() {
  try {
    // Obtener contactos
    const contacts = await sql`
      SELECT
        id,
        email,
        name,
        source,
        subscribed,
        created_at,
        unsubscribed_at,
        metadata
      FROM contacts
      ORDER BY created_at DESC
    `;

    // Obtener estadísticas
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE source = 'hypeddit') as from_hypeddit,
        COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_last_7_days
      FROM contacts
    `;

    return NextResponse.json({
      contacts: contacts.rows,
      stats: stats.rows[0]
    });

  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
