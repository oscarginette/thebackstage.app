/**
 * CsvGenerator
 *
 * Generates RFC 4180-compliant CSV from contact data.
 * Handles metadata flattening and special character escaping.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements ICsvGenerator interface (Dependency Inversion).
 *
 * Security:
 * - Prevents CSV injection via proper escaping
 * - No formula execution (=, +, -, @)
 */

import { ICsvGenerator } from '@/domain/providers/ICsvGenerator';
import { Contact } from '@/domain/repositories/IContactRepository';
import {
  ContactExportColumn,
  CONTACT_EXPORT_COLUMNS,
} from '@/domain/types/csv-export';

export class CsvGenerator implements ICsvGenerator {
  generate(contacts: Contact[], columns: ContactExportColumn[]): string {
    const headers = this.generateHeaders(columns);
    const rows = contacts.map((contact) => this.generateRow(contact, columns));

    return [headers, ...rows].join('\n');
  }

  private generateHeaders(columns: ContactExportColumn[]): string {
    const headers = columns.map((col) => this.getColumnLabel(col));
    return this.escapeRow(headers);
  }

  private generateRow(
    contact: Contact,
    columns: ContactExportColumn[]
  ): string {
    const values = columns.map((col) => this.extractValue(contact, col));
    return this.escapeRow(values);
  }

  private extractValue(contact: Contact, column: ContactExportColumn): string {
    switch (column) {
      case CONTACT_EXPORT_COLUMNS.ID:
        return String(contact.id);

      case CONTACT_EXPORT_COLUMNS.EMAIL:
        return contact.email;

      case CONTACT_EXPORT_COLUMNS.NAME:
        return contact.name || '';

      case CONTACT_EXPORT_COLUMNS.SUBSCRIBED:
        return contact.subscribed ? 'Yes' : 'No';

      case CONTACT_EXPORT_COLUMNS.SOURCE:
        return contact.source || '';

      case CONTACT_EXPORT_COLUMNS.CREATED_AT:
        return this.formatDate(contact.createdAt);

      case CONTACT_EXPORT_COLUMNS.UNSUBSCRIBED_AT:
        return contact.unsubscribedAt
          ? this.formatDate(contact.unsubscribedAt)
          : '';

      case CONTACT_EXPORT_COLUMNS.UNSUBSCRIBE_TOKEN:
        return contact.unsubscribeToken || '';

      case CONTACT_EXPORT_COLUMNS.METADATA:
        return contact.metadata ? JSON.stringify(contact.metadata) : '';

      case CONTACT_EXPORT_COLUMNS.METADATA_SOURCE:
        return contact.metadata?.source || '';

      case CONTACT_EXPORT_COLUMNS.METADATA_IMPORTED_AT:
        return contact.metadata?.importedAt || '';

      case CONTACT_EXPORT_COLUMNS.METADATA_BATCH_ID:
        return contact.metadata?.importBatchId || '';

      case CONTACT_EXPORT_COLUMNS.METADATA_EXTERNAL_ID:
        return contact.metadata?.externalId || '';

      case CONTACT_EXPORT_COLUMNS.METADATA_CUSTOM_FIELDS:
        return contact.metadata?.customFields
          ? JSON.stringify(contact.metadata.customFields)
          : '';

      case CONTACT_EXPORT_COLUMNS.METADATA_TAGS:
        return contact.metadata?.tags?.join(', ') || '';

      case CONTACT_EXPORT_COLUMNS.METADATA_GDPR_DELETED:
        return contact.metadata?.gdprDeleted ? 'Yes' : 'No';

      default:
        return '';
    }
  }

  private getColumnLabel(column: ContactExportColumn): string {
    const labels: Record<ContactExportColumn, string> = {
      id: 'ID',
      email: 'Email',
      name: 'Name',
      subscribed: 'Subscribed',
      source: 'Source',
      createdAt: 'Added Date',
      unsubscribedAt: 'Unsubscribed Date',
      unsubscribeToken: 'Unsubscribe Token',
      metadata: 'Metadata (JSON)',
      'metadata.source': 'Import Source',
      'metadata.importedAt': 'Imported At',
      'metadata.importBatchId': 'Import Batch ID',
      'metadata.externalId': 'External ID',
      'metadata.customFields': 'Custom Fields (JSON)',
      'metadata.tags': 'Tags',
      'metadata.gdprDeleted': 'GDPR Deleted',
    };

    return labels[column] || column;
  }

  private formatDate(dateString: string): string {
    // ISO 8601 to readable format: "2026-01-09 14:30:00"
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').split('.')[0];
  }

  private escapeRow(values: string[]): string {
    // RFC 4180 CSV escaping:
    // - Wrap in quotes if contains comma, quote, or newline
    // - Double-escape existing quotes
    const escaped = values.map((value) => {
      // Guard against null/undefined values
      const safeValue = value ?? '';
      const needsEscape = /[",\n\r]/.test(safeValue);
      const escapedValue = safeValue.replace(/"/g, '""');
      return needsEscape ? `"${escapedValue}"` : escapedValue;
    });

    return escaped.join(',');
  }
}
