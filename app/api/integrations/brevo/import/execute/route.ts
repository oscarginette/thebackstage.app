import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { FetchBrevoContactsUseCase } from '@/domain/services/FetchBrevoContactsUseCase';
import { ImportContactsUseCase } from '@/domain/services/ImportContactsUseCase';
import { BrevoAPIClient } from '@/infrastructure/brevo/BrevoAPIClient';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { PostgresContactImportHistoryRepository } from '@/infrastructure/database/repositories/PostgresContactImportHistoryRepository';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';

export const maxDuration = 60;

/**
 * POST /api/integrations/brevo/import/execute
 *
 * Executes the full Brevo import after user confirmed preview.
 * Reuses ImportContactsUseCase for consistency with file imports.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Create brevo_import_history record (status: 'running')
 * 3. Fetch ALL contacts via FetchBrevoContactsUseCase (previewOnly: false)
 * 4. Reuse ImportContactsUseCase for validation + import
 * 5. Update brevo_import_history with results
 * 6. Update brevo_integrations.last_sync_at
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  let brevoImportHistoryId: number | null = null;

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
      SELECT id, api_key_encrypted, is_active, account_email
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

    // 3. Decrypt API key
    const apiKey = Buffer.from(integration.api_key_encrypted, 'base64').toString('utf-8');

    // 4. Create brevo_import_history record
    const brevoHistoryResult = await sql`
      INSERT INTO brevo_import_history (
        user_id,
        integration_id,
        status,
        preview_used,
        started_at
      )
      VALUES (
        ${userId},
        ${integration.id},
        'running',
        true,
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    brevoImportHistoryId = brevoHistoryResult.rows[0].id;

    console.log(`[User ${userId}] Starting Brevo import (with preview)...`);

    // 5. Fetch ALL contacts from Brevo
    const brevoClient = new BrevoAPIClient(apiKey);
    const fetchUseCase = new FetchBrevoContactsUseCase(brevoClient);

    const fetchResult = await fetchUseCase.execute({
      userId,
      previewOnly: false // Fetch all contacts
    });

    console.log(`[User ${userId}] Fetched ${fetchResult.contacts.length} contacts from Brevo`);

    // 6. Reuse ImportContactsUseCase for consistency with file imports
    const contactRepository = new PostgresContactRepository();
    const importHistoryRepository = new PostgresContactImportHistoryRepository();
    const importUseCase = new ImportContactsUseCase(
      contactRepository,
      importHistoryRepository
    );

    const importResult = await importUseCase.execute({
      userId,
      contacts: fetchResult.contacts,
      fileMetadata: {
        filename: `Brevo Import (${integration.account_email})`,
        fileType: 'brevo',
        totalRows: fetchResult.contacts.length
      },
      columnMapping: ColumnMapping.create('email', 'name', 'subscribed', [])
    });

    console.log(`[User ${userId}] Import complete: ${importResult.contactsInserted} inserted, ${importResult.contactsUpdated} updated`);

    // 7. Update brevo_import_history with results
    const duration = Date.now() - startTime;
    await sql`
      UPDATE brevo_import_history
      SET
        status = 'completed',
        contacts_fetched = ${fetchResult.contacts.length},
        contacts_inserted = ${importResult.contactsInserted},
        contacts_updated = ${importResult.contactsUpdated},
        contacts_skipped = ${importResult.contactsSkipped},
        lists_processed = ${fetchResult.listsProcessed.length},
        completed_at = CURRENT_TIMESTAMP,
        duration_ms = ${duration},
        errors_detail = ${importResult.errors ? JSON.stringify(importResult.errors) : null}
      WHERE id = ${brevoImportHistoryId}
    `;

    // 8. Update brevo_integrations.last_sync_at
    await sql`
      UPDATE brevo_integrations
      SET
        last_sync_at = CURRENT_TIMESTAMP,
        last_error = NULL
      WHERE id = ${integration.id}
    `;

    return NextResponse.json({
      success: true,
      import: {
        importId: brevoImportHistoryId,
        contactsInserted: importResult.contactsInserted,
        contactsUpdated: importResult.contactsUpdated,
        contactsSkipped: importResult.contactsSkipped,
        duration,
        hasErrors: importResult.hasErrors,
        errors: importResult.errors?.slice(0, 10) // First 10 errors only
      }
    });

  } catch (error: unknown) {
    console.error('Brevo import execute error:', error);

    // Update brevo_import_history to failed status
    if (brevoImportHistoryId) {
      try {
        await sql`
          UPDATE brevo_import_history
          SET
            status = 'failed',
            completed_at = CURRENT_TIMESTAMP,
            duration_ms = ${Date.now() - startTime},
            errors_detail = ${JSON.stringify([{ error: error instanceof Error ? error.message : "Unknown error" }])}
          WHERE id = ${brevoImportHistoryId}
        `;
      } catch (updateError) {
        console.error('Failed to update brevo_import_history:', updateError);
      }
    }

    // Handle specific errors
    if (error instanceof Error ? error.message : "Unknown error"?.includes('Invalid API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please reconnect your Brevo account in Settings.' },
        { status: 400 }
      );
    }

    if (error instanceof Error ? error.message : "Unknown error"?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Brevo API rate limit exceeded. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "Unknown error") || 'Failed to execute Brevo import' },
      { status: 500 }
    );
  }
}
