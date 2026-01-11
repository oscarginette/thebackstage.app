/**
 * POST /api/integrations/brevo/preview
 *
 * Fetches contacts from Brevo and returns a preview (first 500 contacts).
 * Reuses the same ImportPreview format as CSV/JSON imports for UI consistency.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { FetchBrevoContactsUseCase } from '@/domain/services/FetchBrevoContactsUseCase';
import { BrevoAPIClient } from '@/infrastructure/brevo/BrevoAPIClient';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';
import { ImportPreview, DetectedColumn } from '@/domain/entities/ImportPreview';

export const maxDuration = 60;

export async function POST(request: Request) {
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

    // 3. Decrypt API key (reverse base64 - use proper decryption in production)
    const apiKey = Buffer.from(integration.apiKeyEncrypted, 'base64').toString('utf-8');

    // 4. Create Brevo client and Use Case
    const brevoClient = new BrevoAPIClient(apiKey);
    const fetchUseCase = new FetchBrevoContactsUseCase(brevoClient);

    console.log(`[User ${userId}] Fetching Brevo preview (limit: 500)...`);

    // 5. Fetch preview (first 500 contacts)
    const fetchResult = await fetchUseCase.execute({
      userId,
      previewOnly: true
    });

    console.log(`[User ${userId}] Fetched ${fetchResult.contacts.length} contacts from ${fetchResult.listsProcessed.length} lists`);

    // 6. Transform to ImportPreview format (compatible with existing UI)
    const preview = createBrevoImportPreview(fetchResult);

    return NextResponse.json({
      success: true,
      preview: {
        filename: `Brevo Import (${integration.accountEmail})`,
        fileType: 'brevo',
        totalRows: preview.totalRows,
        totalRowsAvailable: fetchResult.totalContactsAvailable, // Total in Brevo account
        detectedColumns: preview.detectedColumns,
        sampleRows: preview.sampleRows,
        rawData: preview.rawData,
        metadata: {
          listsProcessed: fetchResult.listsProcessed.map(list => ({
            id: list.id,
            name: list.name,
            totalSubscribers: list.totalSubscribers
          })),
          brevoSource: true
        }
      }
    });

  } catch (error: unknown) {
    console.error('Brevo preview error:', error);

    // Handle specific Brevo API errors
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
      { error: (error instanceof Error ? error.message : "Unknown error") || 'Failed to fetch Brevo preview' },
      { status: 500 }
    );
  }
}

/**
 * Create ImportPreview from FetchBrevoContactsResult
 * Transforms Brevo contacts to the same format as CSV/JSON previews
 */
function createBrevoImportPreview(fetchResult: any): ImportPreview {
  // Create detected columns (Brevo fields are predefined)
  const detectedColumns: DetectedColumn[] = [
    {
      originalName: 'email',
      suggestedField: 'email',
      sampleValues: fetchResult.contacts.slice(0, 3).map((c: any) => c.email),
      confidence: 100 // Brevo always has email
    },
    {
      originalName: 'name',
      suggestedField: 'name',
      sampleValues: fetchResult.contacts.slice(0, 3).map((c: any) => c.name || '(empty)'),
      confidence: 100 // Brevo field mapping is certain
    },
    {
      originalName: 'subscribed',
      suggestedField: 'subscribed',
      sampleValues: fetchResult.contacts.slice(0, 3).map((c: any) => String(c.subscribed)),
      confidence: 100 // Brevo always has subscription status
    }
  ];

  // Transform ImportedContact entities to raw data format
  const rawData = fetchResult.contacts.map((contact: any) => ({
    email: contact.email,
    name: contact.name,
    subscribed: contact.subscribed,
    metadata: contact.metadata,
    rowNumber: contact.rowNumber
  }));

  return ImportPreview.create(
    'Brevo Import',
    'brevo',
    rawData,
    detectedColumns
  );
}
