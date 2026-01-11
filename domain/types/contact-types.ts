/**
 * Contact Types
 *
 * Defines the types of contacts in the system.
 * A contact can be both a fan and a DJ simultaneously.
 *
 * MANDATORY: Always use these constants instead of string literals.
 */

export type ContactType = 'fan' | 'dj';

export const CONTACT_TYPES = {
  FAN: 'fan' as const,
  DJ: 'dj' as const,
} as const;

/**
 * Email Source (GDPR Audit Trail)
 *
 * Tracks how a contact's email was obtained.
 * Required for DJ contacts to ensure GDPR compliance (legitimate interest).
 */
export type EmailSource =
  | 'scraping'
  | 'networking'
  | 'manual'
  | 'event'
  | 'referral'
  | 'import';

export const EMAIL_SOURCES = {
  SCRAPING: 'scraping' as const, // Public profiles (SoundCloud, Instagram, etc)
  NETWORKING: 'networking' as const, // Direct conversation, business card
  MANUAL: 'manual' as const, // Manually added by user
  EVENT: 'event' as const, // Met at event (conference, festival, etc)
  REFERRAL: 'referral' as const, // Referred by another DJ/contact
  IMPORT: 'import' as const, // Bulk CSV import
} as const;

/**
 * List Types
 *
 * Lists are exclusive: a fan list can only contain fans, a DJ list only DJs.
 */
export type ListType = 'fan' | 'dj';

export const LIST_TYPES = {
  FAN: 'fan' as const,
  DJ: 'dj' as const,
} as const;
