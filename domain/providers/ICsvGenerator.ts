/**
 * ICsvGenerator
 *
 * Interface for CSV generation services.
 *
 * Clean Architecture: Domain layer interface.
 * SOLID Compliance:
 * - Dependency Inversion Principle (DIP): Domain depends on abstraction
 * - Interface Segregation Principle (ISP): Focused interface for CSV generation
 * - Open/Closed Principle (OCP): Easy to add new CSV formats without modifying domain
 *
 * Security:
 * - Implementations must prevent CSV injection via proper escaping
 * - No formula execution (=, +, -, @)
 */

import { Contact } from '../repositories/IContactRepository';
import { ContactExportColumn } from '../types/csv-export';

export interface ICsvGenerator {
  /**
   * Generate RFC 4180-compliant CSV from contact data
   * @param contacts - Array of contacts to export
   * @param columns - Columns to include in export
   * @returns CSV string with headers and data rows
   */
  generate(contacts: Contact[], columns: ContactExportColumn[]): string;
}
