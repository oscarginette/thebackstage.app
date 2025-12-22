import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Webhook para recibir contactos desde Hypedit
 *
 * CONFIGURACIÓN EN HYPEDIT/MAKE.COM:
 * - URL: https://tu-dominio.vercel.app/api/webhook/hypedit
 * - Method: POST
 * - Headers: X-Webhook-Secret: [tu secreto]
 *
 * Body esperado:
 * {
 *   "email": "user@example.com",
 *   "name": "John Doe" (opcional),
 *   "track": "My Track Name" (opcional),
 *   "country": "Spain" (opcional),
 *   "metadata": {} (opcional, cualquier dato extra)
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar secreto de webhook (seguridad)
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.HYPEDIT_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parsear el body
    const body = await request.json();
    const { email, name, track, country, metadata = {} } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 3. Preparar metadata combinando datos recibidos
    const contactMetadata = {
      ...metadata,
      track: track || metadata.track,
      country: country || metadata.country,
      source_date: new Date().toISOString()
    };

    // 4. Insertar o actualizar contacto en la DB
    const result = await sql`
      INSERT INTO contacts (email, name, source, subscribed, metadata)
      VALUES (
        ${email.toLowerCase().trim()},
        ${name || null},
        'hypedit',
        true,
        ${JSON.stringify(contactMetadata)}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = COALESCE(contacts.name, EXCLUDED.name),
        metadata = contacts.metadata || EXCLUDED.metadata,
        subscribed = CASE
          WHEN contacts.subscribed = false THEN false
          ELSE true
        END
      RETURNING id, email, subscribed
    `;

    const contact = result.rows[0];

    // 5. Si el contacto estaba desuscrito, no lo reactivamos
    if (!contact.subscribed) {
      return NextResponse.json({
        success: true,
        message: 'Contact exists but is unsubscribed',
        contact_id: contact.id,
        subscribed: false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact added/updated successfully',
      contact_id: contact.id,
      email: contact.email,
      subscribed: contact.subscribed
    });

  } catch (error: any) {
    console.error('Error in Hypedit webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Endpoint de prueba (GET)
 * Útil para verificar que el webhook está funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/hypedit',
    method: 'POST',
    requires: {
      header: 'X-Webhook-Secret',
      body: {
        email: 'required',
        name: 'optional',
        track: 'optional',
        country: 'optional',
        metadata: 'optional'
      }
    }
  });
}
