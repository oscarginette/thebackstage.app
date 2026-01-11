/**
 * POST /api/integrations/brevo/import/execute
 *
 * Executes the full Brevo import after user confirmed preview.
 * Reuses ImportContactsUseCase for consistency with file imports.
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';
import { PostgresBrevoImportHistoryRepository } from '@/infrastructure/database/repositories/PostgresBrevoImportHistoryRepository';

export const maxDuration = 60;

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

    // 2. Get user's Brevo integration via repository
    const brevoIntegrationRepository = new PostgresBrevoIntegrationRepository();
    const integration = await brevoIntegrationRepository.findByUserId(userId);

    if (!integration) {
      return NextResponse.json(
        { error: 'Brevo integration not found. Please connect your Brevo account first.' },
        { status: 404 }
      );
    }

    // 3. Decrypt API key
    const apiKey = Buffer.from(integration.apiKeyEncrypted, 'base64').toString('utf-8');

    // 4. Create brevo_import_history record via repository
    const brevoImportHistoryRepository = new PostgresBrevoImportHistoryRepository();
    const importHistory = await brevoImportHistoryRepository.create({
      userId,
      integrationId: integration.id,
      status: 'running',
      previewUsed: true,
    });

    brevoImportHistoryId = importHistory.id;

    console.log(`[User ${userId}] Starting Brevo import (with preview)...`);

    // 5. Fetch ALL contacts from Brevo
    const brevoClient = UseCaseFactory.createBrevoAPIClient(apiKey);
    const fetchUseCase = UseCaseFactory.createFetchBrevoContactsUseCase(brevoClient);

    const fetchResult = await fetchUseCase.execute({
      userId,
      previewOnly: false // Fetch all contacts
    });

    console.log(`[User ${userId}] Fetched ${fetchResult.contacts.length} contacts from Brevo`);

    // 6. Reuse ImportContactsUseCase for consistency with file imports
    const importUseCase = UseCaseFactory.createImportContactsUseCase();

    const importResult = await importUseCase.execute({
      userId,
      contacts: fetchResult.contacts,
      fileMetadata: {
        filename: `Brevo Import (${integration.accountEmail})`,
        fileType: 'brevo',
        totalRows: fetchResult.contacts.length
      },
      columnMapping: ColumnMapping.create('email', 'name', 'subscribed', [])
    });

    console.log(`[User ${userId}] Import complete: ${importResult.contactsInserted} inserted, ${importResult.contactsUpdated} updated`);

    // 7. Update brevo_import_history with results via repository
    const duration = Date.now() - startTime;
    await brevoImportHistoryRepository.updateWithResults(brevoImportHistoryId, {
      contactsFetched: fetchResult.contacts.length,
      contactsInserted: importResult.contactsInserted,
      contactsUpdated: importResult.contactsUpdated,
      contactsSkipped: importResult.contactsSkipped,
      listsProcessed: fetchResult.listsProcessed.length,
      status: 'completed',
      durationMs: duration,
      errorsDetail: importResult.errors?.map(e => typeof e === 'string' ? e : e.error) || [],
    });

    // 8. Update brevo_integrations.last_sync_at via repository
    await brevoIntegrationRepository.updateLastSync(integration.id);

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

    // Update brevo_import_history to failed status via repository
    if (brevoImportHistoryId) {
      try {
        const brevoImportHistoryRepository = new PostgresBrevoImportHistoryRepository();
        await brevoImportHistoryRepository.updateWithResults(brevoImportHistoryId, {
          contactsFetched: 0,
          contactsInserted: 0,
          contactsUpdated: 0,
          contactsSkipped: 0,
          listsProcessed: 0,
          status: 'failed',
          durationMs: Date.now() - startTime,
          errorsDetail: [error instanceof Error ? error.message : "Unknown error"],
        });
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
