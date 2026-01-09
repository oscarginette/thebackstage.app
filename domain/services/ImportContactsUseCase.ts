import * as Sentry from '@sentry/nextjs';
import { ImportedContact } from '@/domain/entities/ImportedContact';
import { ColumnMapping } from '@/domain/value-objects/ColumnMapping';
import { IContactRepository, BulkImportContactInput } from '@/domain/repositories/IContactRepository';
import { IContactImportHistoryRepository } from '@/domain/repositories/IContactImportHistoryRepository';

/**
 * ImportContactsUseCase
 *
 * Orchestrates the bulk import of contacts with audit trail.
 * Processes contacts in batches and tracks import history.
 *
 * Responsibility (SRP):
 * - Create import history record
 * - Process contacts in batches (500 per batch)
 * - Call repository bulk import
 * - Update history with results
 * - Handle partial failures gracefully
 *
 * Dependencies (DIP):
 * - IContactRepository (injected)
 * - IContactImportHistoryRepository (injected)
 */

export interface ImportInput {
  userId: number;
  contacts: ImportedContact[];
  fileMetadata: {
    filename: string;
    fileType: 'csv' | 'json' | 'brevo';
    fileSizeBytes?: number;
    totalRows: number;
  };
  columnMapping: ColumnMapping;
}

export interface ImportResult {
  success: boolean;
  importId: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  duration: number;
  hasErrors: boolean;
  errors?: Array<{ email: string; error: string }>;
}

export class ImportContactsUseCase {
  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly importHistoryRepository: IContactImportHistoryRepository
  ) {}

  /**
   * Execute the import operation
   */
  async execute(input: ImportInput): Promise<ImportResult> {
    const startTime = Date.now();
    let importHistory: any = null;

    try {
      // Add context for debugging (without PII)
      Sentry.setContext('import_contacts', {
        userId: input.userId,
        contactCount: input.contacts.length,
        fileType: input.fileMetadata.fileType,
        totalRows: input.fileMetadata.totalRows,
        timestamp: new Date().toISOString(),
      });

      // 1. Create import history record (status: pending)
      importHistory = await this.importHistoryRepository.create({
        userId: input.userId,
        originalFilename: input.fileMetadata.filename,
        fileSizeBytes: input.fileMetadata.fileSizeBytes || null,
        fileType: input.fileMetadata.fileType,
        rowsTotal: input.fileMetadata.totalRows,
        columnMapping: {
          sourceFormat: input.fileMetadata.fileType,
          fileName: input.fileMetadata.filename,
          fileSize: input.fileMetadata.fileSizeBytes || undefined,
          hasHeaders: true,
          rowCount: input.fileMetadata.totalRows
        }
      });

      if (!importHistory || !importHistory.id) {
        throw new Error('Failed to create import history: returned null or missing id');
      }

      // 2. Update status to importing
      await this.importHistoryRepository.updateStatus(importHistory.id, 'importing');

      // 3. Process contacts in batches
      const { inserted, updated, skipped, errors } = await this.processBatches(
        input.userId,
        input.contacts,
        input.fileMetadata.fileType
      );

      const duration = Date.now() - startTime;

      // 4. Update import history with success results
      await this.importHistoryRepository.updateWithResults(importHistory.id, {
        contactsInserted: inserted,
        contactsUpdated: updated,
        contactsSkipped: skipped,
        status: 'completed',
        durationMs: duration,
        errorsDetail: errors.length > 0 ? errors.slice(0, 50).map((err, idx) => ({
          row: idx + 1,
          email: err.email,
          message: err.error
        })) : undefined
      });

      // 5. Return success result
      return {
        success: true,
        importId: importHistory.id,
        contactsInserted: inserted,
        contactsUpdated: updated,
        contactsSkipped: skipped,
        duration,
        hasErrors: errors.length > 0,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Import failed with unknown error';

      // Update import history with failure (if it was created)
      if (importHistory) {
        await this.importHistoryRepository.updateWithResults(importHistory.id, {
          contactsInserted: 0,
          contactsUpdated: 0,
          contactsSkipped: 0,
          status: 'failed',
          durationMs: duration,
          errorMessage
        });
      }

      // Capture error to Sentry
      Sentry.captureException(error, {
        tags: {
          useCase: 'ImportContacts',
          userId: input.userId.toString(),
          fileType: input.fileMetadata.fileType,
        },
        extra: {
          contactCount: input.contacts.length,
          totalRows: input.fileMetadata.totalRows,
          duration,
          importId: importHistory.id,
        },
      });

      throw error;
    }
  }

  /**
   * Process contacts in batches of 500
   * Returns aggregated results
   */
  private async processBatches(
    userId: number,
    contacts: ImportedContact[],
    source: 'csv' | 'json' | 'brevo'
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const allErrors: Array<{ email: string; error: string }> = [];

    // Split into batches
    const batches = this.chunkArray(contacts, this.BATCH_SIZE);

    for (const batch of batches) {
      // Convert ImportedContact entities to repository input
      const bulkInput: BulkImportContactInput[] = batch.map(contact => ({
        userId,
        email: contact.email,
        name: contact.name,
        subscribed: contact.subscribed,
        source: source === 'csv' ? 'csv_import' : 'json_import',
        metadata: contact.metadata,
        createdAt: contact.createdAt
      }));

      // Call repository bulk import
      const result = await this.contactRepository.bulkImport(bulkInput);

      // Aggregate results
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      allErrors.push(...result.errors);
    }

    return {
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: allErrors
    };
  }

  /**
   * Split array into chunks of specified size
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
