import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as brevo from '@getbrevo/brevo';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Migración de contactos desde Brevo a base de datos Neon
 *
 * Este endpoint:
 * 1. Obtiene todos los contactos de Brevo (de todas las listas)
 * 2. Los inserta en la tabla `contacts` de Neon
 * 3. Maneja duplicados y mantiene el estado de suscripción
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Validar API key de Brevo
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Inicializar API de Brevo
    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    console.log('Iniciando migración de contactos desde Brevo...');

    // 1. Obtener todas las listas de Brevo
    const listsResponse = await apiInstance.getLists();
    const lists = listsResponse.body.lists || [];

    console.log(`Encontradas ${lists.length} listas en Brevo`);

    let totalContactsFetched = 0;
    let totalContactsInserted = 0;
    let totalContactsUpdated = 0;
    let totalContactsSkipped = 0;
    const errors: string[] = [];

    // 2. Procesar cada lista
    for (const list of lists) {
      console.log(`\nProcesando lista: ${list.name} (ID: ${list.id})`);

      try {
        let offset = 0;
        const limit = 500; // Máximo permitido por Brevo
        let hasMore = true;

        while (hasMore) {
          // Obtener contactos de la lista con paginación
          const contactsResponse = await apiInstance.getContactsFromList(
            list.id,
            undefined, // modifiedSince
            limit,
            offset,
            undefined // sort
          );

          const contacts = contactsResponse.body.contacts || [];
          totalContactsFetched += contacts.length;

          console.log(`  Obtenidos ${contacts.length} contactos (offset: ${offset})`);

          // 3. Insertar/actualizar cada contacto en Neon
          for (const contact of contacts) {
            try {
              const email = contact.email;
              const attributes = contact.attributes as any || {};
              const name = attributes.FIRSTNAME ||
                          attributes.LASTNAME ||
                          attributes.NAME ||
                          null;

              // El nombre completo si tenemos ambos
              const fullName = attributes.FIRSTNAME && attributes.LASTNAME
                ? `${attributes.FIRSTNAME} ${attributes.LASTNAME}`.trim()
                : name;

              // Estado de suscripción (si emailBlacklisted es true, está unsubscribed)
              const subscribed = !contact.emailBlacklisted;

              // Metadata adicional de Brevo
              const metadata = {
                brevo_id: contact.id,
                brevo_list_ids: contact.listIds || [],
                attributes: contact.attributes || {},
                imported_from_brevo: true,
                imported_at: new Date().toISOString()
              };

              // Intentar insertar, si existe actualizar
              const result = await sql`
                INSERT INTO contacts (
                  email,
                  name,
                  source,
                  subscribed,
                  metadata
                )
                VALUES (
                  ${email},
                  ${fullName},
                  'brevo_migration',
                  ${subscribed},
                  ${JSON.stringify(metadata)}::jsonb
                )
                ON CONFLICT (email) DO UPDATE SET
                  name = COALESCE(EXCLUDED.name, contacts.name),
                  subscribed = EXCLUDED.subscribed,
                  metadata = contacts.metadata || EXCLUDED.metadata
                RETURNING (xmax = 0) AS inserted
              `;

              if (result.rows[0].inserted) {
                totalContactsInserted++;
              } else {
                totalContactsUpdated++;
              }

            } catch (contactError: any) {
              console.error(`  Error procesando contacto ${contact.email}:`, contactError.message);
              errors.push(`${contact.email}: ${contactError.message}`);
              totalContactsSkipped++;
            }
          }

          // Verificar si hay más páginas
          if (contacts.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }

          // Pequeña pausa para no saturar la API
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (listError: any) {
        console.error(`Error procesando lista ${list.name}:`, listError.message);
        errors.push(`Lista ${list.name}: ${listError.message}`);
      }
    }

    // 4. Obtener estadísticas finales
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE source = 'brevo_migration') as from_brevo
      FROM contacts
    `;

    const duration = Date.now() - startTime;

    console.log('\n=== MIGRACIÓN COMPLETADA ===');
    console.log(`Duración: ${duration}ms`);
    console.log(`Contactos obtenidos de Brevo: ${totalContactsFetched}`);
    console.log(`Nuevos contactos insertados: ${totalContactsInserted}`);
    console.log(`Contactos actualizados: ${totalContactsUpdated}`);
    console.log(`Contactos con errores: ${totalContactsSkipped}`);
    console.log(`Total en DB: ${stats.rows[0].total_contacts}`);

    return NextResponse.json({
      success: true,
      migration: {
        contactsFetched: totalContactsFetched,
        contactsInserted: totalContactsInserted,
        contactsUpdated: totalContactsUpdated,
        contactsSkipped: totalContactsSkipped,
        listsProcessed: lists.length,
        duration,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Máximo 10 errores
      },
      database: {
        totalContacts: stats.rows[0].total_contacts,
        activeSubscribers: stats.rows[0].active_subscribers,
        unsubscribed: stats.rows[0].unsubscribed,
        fromBrevo: stats.rows[0].from_brevo
      }
    });

  } catch (error: any) {
    console.error('Error en migración:', error);

    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Verificar estado de la migración sin ejecutarla
 */
export async function GET() {
  try {
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE source = 'brevo_migration') as from_brevo,
        COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit
      FROM contacts
    `;

    return NextResponse.json({
      database: stats.rows[0],
      message: 'Use POST to execute migration'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
