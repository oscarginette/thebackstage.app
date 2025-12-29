import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';
import { ValidateImportDataUseCase } from '@/domain/services/ValidateImportDataUseCase';
import { ImportContactsUseCase } from '@/domain/services/ImportContactsUseCase';
import { CheckContactQuotaUseCase } from '@/domain/services/CheckContactQuotaUseCase';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import { PostgresContactImportHistoryRepository } from '@/infrastructure/database/repositories/PostgresContactImportHistoryRepository';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { ImportContactsSchema } from '@/lib/validation-schemas';

export const maxDuration = 60; // Maximum duration for import (60 seconds)

/**
 * POST /api/contacts/import/execute
 *
 * Executes the contact import with user-confirmed column mapping.
 * Validates data, imports to database, and tracks import history.
 *
 * Orchestration Layer (Clean Architecture):
 * - Authenticates user
 * - Creates ColumnMapping value object
 * - Validates data via ValidateImportDataUseCase
 * - Executes import via ImportContactsUseCase
 * - Returns results
 *
 * Dependency Injection:
 * - Instantiates repositories
 * - Injects into use cases
 */
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

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = ImportContactsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { rawData, columnMapping, fileMetadata } = validation.data;

    // 3. Create ColumnMapping value object
    const mapping = new ColumnMapping(
      columnMapping.emailColumn,
      columnMapping.nameColumn ?? null,
      columnMapping.subscribedColumn ?? null,
      columnMapping.metadataColumns || []
    );

    // 4. Validate data
    const validateUseCase = new ValidateImportDataUseCase();
    const validationResult = validateUseCase.execute(rawData, mapping);

    if (validationResult.validContacts.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid contacts found',
          validationErrors: validationResult.errors,
          summary: validationResult.summary
        },
        { status: 400 }
      );
    }

    // 4.5. Check quota (informational, doesn't block import)
    const contactRepository = new PostgresContactRepository();
    const userRepository = new PostgresUserRepository();

    const checkQuotaUseCase = new CheckContactQuotaUseCase(
      userRepository,
      contactRepository
    );

    const quotaCheck = await checkQuotaUseCase.execute({
      userId,
      additionalContacts: validationResult.validContacts.length,
    });

    // 5. Execute import with Dependency Injection (always allow)
    const importHistoryRepository = new PostgresContactImportHistoryRepository();

    const importUseCase = new ImportContactsUseCase(
      contactRepository,
      importHistoryRepository
    );

    const importResult = await importUseCase.execute({
      userId,
      contacts: validationResult.validContacts,
      fileMetadata: {
        filename: fileMetadata.filename,
        fileType: fileMetadata.fileType as 'json' | 'csv' | 'brevo',
        fileSizeBytes: fileMetadata.fileSizeBytes,
        totalRows: rawData.length
      },
      columnMapping: mapping
    });

    // 6. Get updated contact count AFTER import
    const finalContactCount = await contactRepository.countByUserId(userId);

    // Recalculate quota status with final count
    const finalQuotaCheck = await checkQuotaUseCase.execute({
      userId,
      additionalContacts: 0, // No additional contacts, just checking current status
    });

    // 7. Return success result with UPDATED quota info
    return NextResponse.json({
      success: true,
      import: {
        importId: importResult.importId,
        contactsInserted: importResult.contactsInserted,
        contactsUpdated: importResult.contactsUpdated,
        contactsSkipped: importResult.contactsSkipped,
        duration: importResult.duration,
        hasErrors: importResult.hasErrors,
        errors: importResult.errors
      },
      validation: {
        totalRows: validationResult.summary.total,
        validRows: validationResult.summary.valid,
        invalidRows: validationResult.summary.invalid,
        validationErrors: validationResult.errors.slice(0, 10) // First 10 validation errors
      },
      quota: {
        exceeded: !finalQuotaCheck.allowed,
        currentCount: finalContactCount, // Updated count after import
        limit: finalQuotaCheck.limit,
        remaining: finalQuotaCheck.remaining,
        message: finalQuotaCheck.message
      }
    });
  } catch (error: unknown) {
    console.error('Error executing import:', error);

    return NextResponse.json(
      {
        error: 'Failed to execute import',
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
