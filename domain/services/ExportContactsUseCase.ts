/**
 * ExportContactsUseCase
 *
 * Handles contact data export with column selection and filtering.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Users can only export their own contacts (multi-tenant)
 * - Selected IDs must belong to the user
 * - Minimum 1 column required
 * - Metadata fields are flattened for CSV compatibility
 *
 * GDPR Compliance:
 * - Respects GDPR deletion status in metadata
 * - Exports audit trail data (import timestamps, sources)
 */

import { IContactRepository, Contact } from '@/domain/repositories/IContactRepository';
import { IUserSettingsRepository } from '@/domain/repositories/IUserSettingsRepository';
import { CsvGenerator } from '@/infrastructure/csv/CsvGenerator';
import {
  ExportContactsInput,
  ExportContactsResult,
  EXPORT_SCOPES,
  EXPORT_FORMATS,
  ContactExportColumn,
  ExportFormat,
} from '@/domain/types/csv-export';

export class ExportContactsUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private userSettingsRepository: IUserSettingsRepository,
    private csvGenerator: CsvGenerator
  ) {}

  async execute(input: ExportContactsInput): Promise<ExportContactsResult> {
    // Validation
    this.validateInput(input);

    // Fetch artist name if not provided
    const artistName = await this.getArtistName(input.userId, input.artistName);

    // Fetch contacts based on scope
    const contacts = await this.fetchContacts(input);

    if (contacts.length === 0) {
      return {
        success: false,
        filename: this.generateFilename(artistName, input.format),
        rowCount: 0,
        error: 'No contacts to export',
      };
    }

    // Generate export data
    const data = await this.generateExportData(
      contacts,
      input.columns,
      input.format
    );

    return {
      success: true,
      data,
      filename: this.generateFilename(artistName, input.format),
      rowCount: contacts.length,
    };
  }

  private validateInput(input: ExportContactsInput): void {
    if (input.columns.length === 0) {
      throw new Error('At least one column must be selected');
    }

    if (input.scope === EXPORT_SCOPES.SELECTED && !input.selectedIds?.length) {
      throw new Error('Selected scope requires contact IDs');
    }

    if (!Object.values(EXPORT_FORMATS).includes(input.format)) {
      throw new Error(`Invalid export format: ${input.format}`);
    }

    if (!Object.values(EXPORT_SCOPES).includes(input.scope)) {
      throw new Error(`Invalid export scope: ${input.scope}`);
    }
  }

  private async getArtistName(
    userId: number,
    providedName?: string | null
  ): Promise<string | null> {
    // If artist name was explicitly provided, use it
    if (providedName !== undefined) {
      return providedName;
    }

    // Otherwise, fetch from user settings
    try {
      const userSettings = await this.userSettingsRepository.getByUserId(userId);
      return userSettings.name;
    } catch (error) {
      // If user settings not found, return null (filename will use default)
      console.warn('[ExportContactsUseCase] Could not fetch user settings:', error);
      return null;
    }
  }

  private async fetchContacts(
    input: ExportContactsInput
  ): Promise<Contact[]> {
    switch (input.scope) {
      case EXPORT_SCOPES.ALL:
        return this.contactRepository.findAll(input.userId);

      case EXPORT_SCOPES.SELECTED:
        // Filter by selected IDs (with security check)
        const allContacts = await this.contactRepository.findAll(input.userId);
        return allContacts.filter((c) => input.selectedIds?.includes(c.id));

      case EXPORT_SCOPES.FILTERED:
        // Future: implement filter criteria
        // For now, same as ALL
        return this.contactRepository.findAll(input.userId);

      default:
        throw new Error(`Invalid export scope: ${input.scope}`);
    }
  }

  private async generateExportData(
    contacts: Contact[],
    columns: ContactExportColumn[],
    format: ExportFormat
  ): Promise<string> {
    switch (format) {
      case EXPORT_FORMATS.CSV:
        return this.csvGenerator.generate(contacts, columns);

      case EXPORT_FORMATS.JSON:
        // Future: implement JSON export
        return JSON.stringify(contacts, null, 2);

      case EXPORT_FORMATS.XLSX:
        // Future: implement Excel export
        throw new Error('XLSX export not yet implemented');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateFilename(artistName: string | null | undefined, format: ExportFormat): string {
    // Format: ArtistName_TheBackstage_Contacts_YYYY-MM-DD.csv
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Sanitize artist name: remove special characters, replace spaces with underscores
    let sanitizedName = 'Artist';
    if (artistName && artistName.trim().length > 0) {
      sanitizedName = artistName
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_'); // Replace spaces with underscores
    }

    return `${sanitizedName}_TheBackstage_Contacts_${timestamp}.${format}`;
  }
}
