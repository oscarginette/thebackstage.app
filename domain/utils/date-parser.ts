/**
 * Date Parser Utility
 *
 * Parses various date formats including:
 * - Relative dates: "7 months ago", "25 days ago", "3 years ago"
 * - ISO dates: "2024-01-15"
 * - Standard dates: "01/15/2024", "15-01-2024"
 *
 * Clean Architecture:
 * - Domain utility with NO external dependencies
 * - Pure functions
 * - Handles edge cases and validation
 */

export class DateParseError extends Error {
  constructor(message: string, public readonly originalValue: string) {
    super(message);
    this.name = 'DateParseError';
  }
}

/**
 * Parse relative date strings (e.g., "7 months ago", "25 days ago")
 * Returns Date object calculated from current date
 *
 * Supported formats:
 * - "X days ago"
 * - "X weeks ago"
 * - "X months ago"
 * - "X years ago"
 * - "X day ago" (singular)
 * - "X month ago" (singular)
 * - etc.
 */
export function parseRelativeDate(value: string): Date | null {
  const normalized = value.toLowerCase().trim();

  // Pattern: "X <unit> ago" or "X <unit>s ago"
  const relativePattern = /^(\d+)\s+(day|week|month|year)s?\s+ago$/i;
  const match = normalized.match(relativePattern);

  if (!match) {
    return null;
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (isNaN(amount) || amount < 0) {
    return null;
  }

  const now = new Date();
  const result = new Date(now);

  switch (unit) {
    case 'day':
      result.setDate(result.getDate() - amount);
      break;
    case 'week':
      result.setDate(result.getDate() - (amount * 7));
      break;
    case 'month':
      result.setMonth(result.getMonth() - amount);
      break;
    case 'year':
      result.setFullYear(result.getFullYear() - amount);
      break;
    default:
      return null;
  }

  return result;
}

/**
 * Parse ISO date (YYYY-MM-DD, YYYY/MM/DD)
 */
export function parseISODate(value: string): Date | null {
  const isoPattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const match = value.match(isoPattern);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Validate ranges
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);

  // Check if date is valid (handles invalid dates like Feb 31)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Parse standard date formats (MM/DD/YYYY, DD-MM-YYYY, etc.)
 * Tries common formats
 */
export function parseStandardDate(value: string): Date | null {
  // Try MM/DD/YYYY or DD/MM/YYYY (ambiguous, assumes MM/DD/YYYY)
  const slashPattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = value.match(slashPattern);

  if (!match) {
    return null;
  }

  // Assume MM/DD/YYYY (US format)
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Validate ranges
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);

  // Check if date is valid
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Main parser: tries all date formats
 * Returns Date object or null if unparseable
 *
 * Priority:
 * 1. Relative dates ("7 months ago")
 * 2. ISO dates ("2024-01-15")
 * 3. Standard dates ("01/15/2024")
 * 4. JavaScript Date constructor (last resort)
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Convert to string
  const strValue = String(value).trim();

  if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
    return null;
  }

  // Try relative date ("7 months ago")
  const relativeDate = parseRelativeDate(strValue);
  if (relativeDate) {
    return relativeDate;
  }

  // Try ISO date (YYYY-MM-DD)
  const isoDate = parseISODate(strValue);
  if (isoDate) {
    return isoDate;
  }

  // Try standard date (MM/DD/YYYY)
  const standardDate = parseStandardDate(strValue);
  if (standardDate) {
    return standardDate;
  }

  // Last resort: JavaScript Date constructor
  try {
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      // Sanity check: reject dates too far in past or future
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return date;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Detect if a column name suggests it contains dates
 * Used for auto-detection in import wizard
 */
export function isDateColumn(columnName: string): boolean {
  const normalized = columnName.toLowerCase().trim();

  const dateKeywords = [
    'date',
    'created',
    'added',
    'joined',
    'since',
    'signup',
    'registered',
    'subscribed_at',
    'created_at',
    'timestamp',
    'time'
  ];

  return dateKeywords.some(keyword => normalized.includes(keyword));
}
