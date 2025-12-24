import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import * as brevo from '@getbrevo/brevo';

export const maxDuration = 60; // Maximum duration for Vercel serverless functions

/**
 * POST /api/integrations/brevo/import
 *
 * Imports all contacts from the user's Brevo account into their Backstage contacts.
 * - Fetches all contacts from all Brevo lists
 * - Handles pagination (Brevo limit: 500 contacts per request)
 * - Deduplicates by email (user_id + email)
 * - Tracks import history for audit trail
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  let importHistoryId: number | null = null;

  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Get user's Brevo integration
    const integrationResult = await sql`
      SELECT id, api_key_encrypted, is_active
      FROM brevo_integrations
      WHERE user_id = ${userId} AND is_active = true
    `;

    if (integrationResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Brevo integration not found. Please connect your Brevo account first.' },
        { status: 404 }
      );
    }

    const integration = integrationResult.rows[0];

    // 3. Decrypt API key (reverse base64 - use proper decryption in production)
    const apiKey = Buffer.from(integration.api_key_encrypted, 'base64').toString('utf-8');

    // 4. Initialize Brevo API
    const contactsApi = new brevo.ContactsApi();
    contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

    // 5. Create import history record
    const historyResult = await sql`
      INSERT INTO brevo_import_history (
        user_id,
        integration_id,
        status,
        started_at
      )
      VALUES (
        ${userId},
        ${integration.id},
        'running',
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    importHistoryId = historyResult.rows[0].id;

    console.log(`[User ${userId}] Starting Brevo import...`);

    // 6. Fetch all lists from Brevo
    const listsResponse = await contactsApi.getLists();
    const lists = listsResponse.body.lists || [];

    console.log(`[User ${userId}] Found ${lists.length} Brevo lists`);

    let totalContactsFetched = 0;
    let totalContactsInserted = 0;
    let totalContactsUpdated = 0;
    let totalContactsSkipped = 0;
    const errors: string[] = [];

    // 7. Process each list
    for (const list of lists) {
      console.log(`[User ${userId}] Processing list: ${list.name} (ID: ${list.id})`);

      try {
        let offset = 0;
        const limit = 500; // Brevo's maximum
        let hasMore = true;

        while (hasMore) {
          // Fetch contacts from this list with pagination
          const contactsResponse = await contactsApi.getContactsFromList(
            list.id,
            undefined, // modifiedSince
            limit,
            offset,
            undefined // sort
          );

          const contacts = contactsResponse.body.contacts || [];
          totalContactsFetched += contacts.length;

          console.log(`[User ${userId}] Fetched ${contacts.length} contacts from list ${list.name} (offset: ${offset})`);

          // 8. Insert/update each contact
          for (const contact of contacts) {
            try {
              const email = contact.email;

              // Extract name from Brevo attributes
              const attrs = contact.attributes as any;
              const firstName = attrs?.FIRSTNAME || '';
              const lastName = attrs?.LASTNAME || '';
              const name = attrs?.NAME ||
                           (firstName && lastName ? `${firstName} ${lastName}`.trim() : null);

              // Check subscription status (emailBlacklisted = unsubscribed)
              const subscribed = !contact.emailBlacklisted;

              // Prepare metadata
              const metadata = {
                brevo_id: contact.id,
                brevo_list_ids: contact.listIds || [],
                attributes: attrs || {},
                imported_from_brevo: true,
                imported_at: new Date().toISOString()
              };

              // Insert or update contact
              const result = await sql`
                INSERT INTO contacts (
                  user_id,
                  email,
                  name,
                  source,
                  subscribed,
                  brevo_id,
                  brevo_list_ids,
                  metadata
                )
                VALUES (
                  ${userId},
                  ${email},
                  ${name},
                  'brevo_import',
                  ${subscribed},
                  ${contact.id.toString()},
                  ${contact.listIds || []},
                  ${JSON.stringify(metadata)}::jsonb
                )
                ON CONFLICT (user_id, email) DO UPDATE SET
                  name = COALESCE(EXCLUDED.name, contacts.name),
                  subscribed = EXCLUDED.subscribed,
                  brevo_id = EXCLUDED.brevo_id,
                  brevo_list_ids = EXCLUDED.brevo_list_ids,
                  metadata = contacts.metadata || EXCLUDED.metadata,
                  updated_at = CURRENT_TIMESTAMP
                RETURNING (xmax = 0) AS inserted
              `;

              // Check if it was an insert or update
              if (result.rows[0].inserted) {
                totalContactsInserted++;
              } else {
                totalContactsUpdated++;
              }

            } catch (contactError: any) {
              console.error(`[User ${userId}] Error processing contact ${contact.email}:`, contactError.message);
              errors.push(`${contact.email}: ${contactError.message}`);
              totalContactsSkipped++;
            }
          }

          // Check if there are more pages
          if (contacts.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }

          // Rate limiting: Small pause to avoid overwhelming Brevo API
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (listError: any) {
        console.error(`[User ${userId}] Error processing list ${list.name}:`, listError.message);
        errors.push(`List ${list.name}: ${listError.message}`);
      }
    }

    const duration = Date.now() - startTime;

    // 9. Update import history with results
    await sql`
      UPDATE brevo_import_history
      SET
        contacts_fetched = ${totalContactsFetched},
        contacts_inserted = ${totalContactsInserted},
        contacts_updated = ${totalContactsUpdated},
        contacts_skipped = ${totalContactsSkipped},
        lists_processed = ${lists.length},
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        duration_ms = ${duration},
        errors_detail = ${errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null}::jsonb
      WHERE id = ${importHistoryId}
    `;

    // 10. Update integration last_sync_at
    await sql`
      UPDATE brevo_integrations
      SET
        last_sync_at = CURRENT_TIMESTAMP,
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${integration.id}
    `;

    console.log(`[User ${userId}] Import completed: ${totalContactsFetched} fetched, ${totalContactsInserted} inserted, ${totalContactsUpdated} updated`);

    // 11. Return success response
    return NextResponse.json({
      success: true,
      import: {
        contactsFetched: totalContactsFetched,
        contactsInserted: totalContactsInserted,
        contactsUpdated: totalContactsUpdated,
        contactsSkipped: totalContactsSkipped,
        listsProcessed: lists.length,
        duration,
        hasErrors: errors.length > 0,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      }
    });

  } catch (error: any) {
    console.error('Error importing Brevo contacts:', error);

    // Mark import as failed
    if (importHistoryId) {
      await sql`
        UPDATE brevo_import_history
        SET
          status = 'failed',
          completed_at = CURRENT_TIMESTAMP,
          duration_ms = ${Date.now() - startTime},
          error_message = ${error.message}
        WHERE id = ${importHistoryId}
      `;
    }

    // Update integration with error
    const session = await auth();
    if (session?.user?.id) {
      await sql`
        UPDATE brevo_integrations
        SET
          last_error = ${error.message},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${parseInt(session.user.id)}
      `;
    }

    return NextResponse.json(
      { error: 'Failed to import contacts from Brevo', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/brevo/import
 *
 * Returns the import history for the authenticated user.
 */
export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Fetch import history
    const result = await sql`
      SELECT
        id,
        contacts_fetched,
        contacts_inserted,
        contacts_updated,
        contacts_skipped,
        lists_processed,
        status,
        started_at,
        completed_at,
        duration_ms,
        error_message
      FROM brevo_import_history
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      imports: result.rows.map((row: any) => ({
        id: row.id,
        contactsFetched: row.contacts_fetched,
        contactsInserted: row.contacts_inserted,
        contactsUpdated: row.contacts_updated,
        contactsSkipped: row.contacts_skipped,
        listsProcessed: row.lists_processed,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        duration: row.duration_ms,
        error: row.error_message
      }))
    });

  } catch (error: any) {
    console.error('Error fetching import history:', error);

    return NextResponse.json(
      { error: 'Failed to fetch import history', details: error.message },
      { status: 500 }
    );
  }
}
