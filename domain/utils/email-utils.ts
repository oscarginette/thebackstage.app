/**
 * Email Utility Functions
 *
 * Provides utilities for parsing and extracting information from email addresses.
 *
 * Clean Architecture:
 * - Domain utility with NO external dependencies
 * - Pure functions
 * - Handles edge cases and validation
 * - Throws typed errors for invalid input
 */

export class EmailParseError extends Error {
  constructor(message: string, public readonly originalValue: string) {
    super(message);
    this.name = 'EmailParseError';
  }
}

/**
 * Extract domain from email address
 *
 * Supports various email formats:
 * - Standard: "info@geebeat.com" → "geebeat.com"
 * - RFC 5322 (with name): "Artist Name <info@geebeat.com>" → "geebeat.com"
 * - Quoted names: '"Artist, Name" <info@geebeat.com>' → "geebeat.com"
 * - Multiple TLDs: "artist@domain.co.uk" → "domain.co.uk"
 * - With whitespace: "  info@geebeat.com  " → "geebeat.com"
 *
 * @param emailAddress - Email address in any supported format
 * @returns Extracted domain (e.g., "geebeat.com", "domain.co.uk")
 * @throws EmailParseError if email format is invalid
 *
 * @example
 * ```typescript
 * extractDomainFromEmail("info@geebeat.com")
 * // Returns: "geebeat.com"
 *
 * extractDomainFromEmail("Artist Name <info@geebeat.com>")
 * // Returns: "geebeat.com"
 *
 * extractDomainFromEmail("invalid-email")
 * // Throws: EmailParseError
 * ```
 */
export function extractDomainFromEmail(emailAddress: string): string {
  // Validate input
  if (!emailAddress || typeof emailAddress !== 'string') {
    throw new EmailParseError(
      'Email address is required and must be a string',
      String(emailAddress)
    );
  }

  const trimmedInput = emailAddress.trim();

  if (trimmedInput === '') {
    throw new EmailParseError(
      'Email address cannot be empty',
      emailAddress
    );
  }

  // Extract email from "Name <email@domain.com>" format (RFC 5322)
  // Handles:
  // - "Artist Name <info@geebeat.com>"
  // - "info@geebeat.com" (no angle brackets)
  // - '"Artist, Name" <info@geebeat.com>' (quoted names)
  const emailMatch = trimmedInput.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1].trim() : trimmedInput;

  // Extract domain from email@domain.com
  // Pattern: anything before @ + domain after @
  const domainMatch = email.match(/@(.+)$/);

  if (!domainMatch || !domainMatch[1]) {
    throw new EmailParseError(
      `Invalid email format: missing '@' or domain`,
      emailAddress
    );
  }

  const domain = domainMatch[1].trim();

  // Validate domain is not empty
  if (domain === '') {
    throw new EmailParseError(
      `Invalid email format: domain is empty`,
      emailAddress
    );
  }

  // Basic domain validation (at least one dot and valid characters)
  // Allows: domain.com, domain.co.uk, subdomain.domain.com
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

  if (!domainPattern.test(domain)) {
    throw new EmailParseError(
      `Invalid domain format: ${domain}`,
      emailAddress
    );
  }

  return domain;
}

/**
 * Extract local part from email address (part before @)
 *
 * @param emailAddress - Email address in any supported format
 * @returns Local part (e.g., "info", "artist.name")
 * @throws EmailParseError if email format is invalid
 *
 * @example
 * ```typescript
 * extractLocalPartFromEmail("info@geebeat.com")
 * // Returns: "info"
 *
 * extractLocalPartFromEmail("Artist Name <info@geebeat.com>")
 * // Returns: "info"
 * ```
 */
export function extractLocalPartFromEmail(emailAddress: string): string {
  // Validate input
  if (!emailAddress || typeof emailAddress !== 'string') {
    throw new EmailParseError(
      'Email address is required and must be a string',
      String(emailAddress)
    );
  }

  const trimmedInput = emailAddress.trim();

  if (trimmedInput === '') {
    throw new EmailParseError(
      'Email address cannot be empty',
      emailAddress
    );
  }

  // Extract email from "Name <email@domain.com>" format
  const emailMatch = trimmedInput.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1].trim() : trimmedInput;

  // Extract local part (before @)
  const localMatch = email.match(/^(.+?)@/);

  if (!localMatch || !localMatch[1]) {
    throw new EmailParseError(
      `Invalid email format: missing '@' or local part`,
      emailAddress
    );
  }

  const localPart = localMatch[1].trim();

  // Validate local part is not empty
  if (localPart === '') {
    throw new EmailParseError(
      `Invalid email format: local part is empty`,
      emailAddress
    );
  }

  return localPart;
}

/**
 * Normalize email address to standard format (lowercase, no whitespace)
 *
 * Extracts email from RFC 5322 format and normalizes:
 * - "Artist Name <Info@GeeBeat.com>" → "info@geebeat.com"
 * - "  INFO@GEEBEAT.COM  " → "info@geebeat.com"
 *
 * @param emailAddress - Email address in any supported format
 * @returns Normalized email address (lowercase, trimmed)
 * @throws EmailParseError if email format is invalid
 */
export function normalizeEmail(emailAddress: string): string {
  // Validate input
  if (!emailAddress || typeof emailAddress !== 'string') {
    throw new EmailParseError(
      'Email address is required and must be a string',
      String(emailAddress)
    );
  }

  const trimmedInput = emailAddress.trim();

  if (trimmedInput === '') {
    throw new EmailParseError(
      'Email address cannot be empty',
      emailAddress
    );
  }

  // Extract email from "Name <email@domain.com>" format
  const emailMatch = trimmedInput.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1].trim() : trimmedInput;

  // Validate email has @ symbol
  if (!email.includes('@')) {
    throw new EmailParseError(
      `Invalid email format: missing '@'`,
      emailAddress
    );
  }

  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new EmailParseError(
      `Invalid email format`,
      emailAddress
    );
  }

  return email.toLowerCase();
}

/**
 * Validate if a string is a valid email address
 *
 * @param emailAddress - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(emailAddress: string): boolean {
  try {
    normalizeEmail(emailAddress);
    return true;
  } catch {
    return false;
  }
}
