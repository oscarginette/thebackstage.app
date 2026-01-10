/**
 * Metadata Type Definitions
 *
 * Strongly-typed metadata interfaces for all domain entities.
 * Replaces `any` types with proper TypeScript interfaces.
 *
 * Clean Architecture + Type Safety:
 * - Explicit types for all metadata fields
 * - Optional fields for flexibility
 * - Self-documenting code
 */

/**
 * Contact Metadata
 *
 * Additional information stored with contact records.
 * Used for import tracking, custom fields, and GDPR compliance.
 */
export interface ContactMetadata {
  /** Contact types (e.g., ['fan'], ['dj'], or ['fan', 'dj']) */
  types?: string[];

  /** DJ-specific metadata (only for DJ contacts) */
  djMetadata?: {
    emailSource: string;
    genres?: string[];
    platforms?: string[];
    location?: string;
    followersCount?: number;
    notes?: string;
  };

  /** Import source identifier (e.g., 'brevo', 'csv_import', 'manual') */
  source?: string;

  /** ISO 8601 timestamp when contact was imported */
  importedAt?: string;

  /** Batch ID for bulk imports (UUID) */
  importBatchId?: string;

  /** Original data from import source (preserved for audit) */
  originalData?: Record<string, unknown>;

  /** User-defined custom fields (e.g., 'location', 'age', 'preference') */
  customFields?: Record<string, string | number | boolean>;

  /** Tags for segmentation (e.g., ['vip', 'newsletter']) */
  tags?: string[];

  /** External system ID (e.g., Brevo contact ID, Mailchimp ID) */
  externalId?: string;

  /** GDPR: True if contact was anonymized (7-year retention) */
  gdprDeleted?: boolean;

  /** ISO 8601 timestamp of last metadata update */
  lastUpdated?: string;

  /** Additional unmapped columns from CSV imports */
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

/**
 * Email Campaign Metadata
 *
 * Additional information for email campaigns.
 * Used for scheduling, tracking, and template variables.
 */
export interface EmailCampaignMetadata {
  /** ISO 8601 timestamp for scheduled send */
  scheduledFor?: string;

  /** ISO 8601 timestamp when campaign was sent */
  sentAt?: string;

  /** Email template identifier (UUID) */
  templateId?: string;

  /** Template variables (e.g., {firstName: 'John', discount: '20%'}) */
  variables?: Record<string, string>;

  /** Enable click/open tracking (default: true) */
  trackingEnabled?: boolean;

  /** Custom email headers (e.g., {'X-Campaign-ID': '123'}) */
  customHeaders?: Record<string, string>;

  /** A/B test variant identifier */
  variant?: string;

  /** Campaign notes or description */
  notes?: string;
}

/**
 * Download Gate Metadata
 *
 * Additional information for download gates.
 * Used for categorization, external URLs, and custom fields.
 */
export interface DownloadGateMetadata {
  /** Category (e.g., 'remix', 'original', 'sample_pack') */
  category?: string;

  /** Tags for filtering (e.g., ['house', 'edm', 'free']) */
  tags?: string[];

  /** External URL (e.g., Spotify link, SoundCloud URL) */
  externalUrl?: string;

  /** File size in bytes */
  fileSize?: number;

  /** MIME type (e.g., 'audio/mpeg', 'application/zip') */
  fileType?: string;

  /** User-defined custom fields */
  customFields?: Record<string, string | number | boolean>;

  /** BPM for music tracks */
  bpm?: number;

  /** Musical key (e.g., 'Am', 'C#') */
  key?: string;

  /** Release date (ISO 8601) */
  releaseDate?: string;
}

/**
 * Consent History Metadata
 *
 * Additional information for consent changes (GDPR compliance).
 * Used for audit trail and legal defense.
 */
export interface ConsentHistoryMetadata {
  /** User-provided reason for unsubscribe */
  reason?: string;

  /** Channel where consent changed (email_link, settings_page, api, admin) */
  channel?: 'email_link' | 'settings_page' | 'api' | 'admin';

  /** Campaign ID that triggered consent change (UUID) */
  campaignId?: string;

  /** Previous subscription status (for resubscribe tracking) */
  previousStatus?: boolean;

  /** Admin notes (for manual changes) */
  notes?: string;

  /** Bounce type (for bounce events) */
  bounce_type?: 'hard' | 'soft';

  /** Track ID (for consent changes from track campaigns) */
  track_id?: string;

  /** Campaign name (for reporting) */
  campaign_name?: string;
}

/**
 * Column Mapping Metadata
 *
 * Additional information for CSV import column mappings.
 * Used for import history and debugging.
 */
export interface ColumnMappingMetadata {
  /** Source format (e.g., 'csv', 'json', 'excel') */
  sourceFormat?: string;

  /** File encoding (e.g., 'utf-8', 'iso-8859-1') */
  encoding?: string;

  /** CSV delimiter (e.g., ',', ';', '\t') */
  delimiter?: string;

  /** True if first row contains headers */
  hasHeaders?: boolean;

  /** Total number of rows in source file */
  rowCount?: number;

  /** File name */
  fileName?: string;

  /** File size in bytes */
  fileSize?: number;

  /** ISO 8601 timestamp of import */
  importedAt?: string;

  /** User ID who performed import */
  importedBy?: number;
}

/**
 * User Settings Metadata
 *
 * Additional user preferences and configuration.
 * Used for UI customization and feature flags.
 */
export interface UserSettingsMetadata {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'auto';

  /** Notification preferences */
  notifications?: {
    email?: boolean;
    browser?: boolean;
    sms?: boolean;
  };

  /** User preferences (generic key-value store) */
  preferences?: Record<string, unknown>;

  /** Feature flags for beta features */
  features?: {
    betaFeatures?: boolean;
    advancedAnalytics?: boolean;
    aiAssistant?: boolean;
  };

  /** Onboarding completion status */
  onboarding?: {
    completed?: boolean;
    currentStep?: number;
    skipped?: boolean;
  };

  /** Last login timestamp (ISO 8601) */
  lastLogin?: string;

  /** Timezone (e.g., 'America/New_York', 'Europe/London') */
  timezone?: string;

  /** Language preference (ISO 639-1 code: 'en', 'es', 'fr') */
  language?: string;
}

/**
 * Import History Metadata
 *
 * Additional information for contact import history records.
 * Used for tracking import success/failure and debugging.
 */
export interface ImportHistoryMetadata {
  /** Import source (e.g., 'brevo', 'csv', 'api') */
  source?: string;

  /** File name (for file-based imports) */
  fileName?: string;

  /** File size in bytes */
  fileSize?: number;

  /** Number of rows processed */
  rowsProcessed?: number;

  /** Number of successful imports */
  successCount?: number;

  /** Number of failed imports */
  errorCount?: number;

  /** Error messages (if any) */
  errors?: Array<{
    row?: number;
    email?: string;
    message: string;
  }>;

  /** Column mapping used */
  columnMapping?: {
    emailColumn: string;
    nameColumn?: string;
    subscribedColumn?: string;
    metadataColumns?: string[];
  };

  /** Import duration in milliseconds */
  durationMs?: number;

  /** User ID who performed import */
  importedBy?: number;
}

/**
 * Email Event Metadata
 *
 * Additional information for email events (opens, clicks, bounces).
 * Used for analytics and deliverability tracking.
 */
export interface EmailEventMetadata {
  /** Campaign ID associated with event */
  campaignId?: string;

  /** Track ID associated with event */
  trackId?: string;

  /** Email subject line */
  subject?: string;

  /** User agent string */
  userAgent?: string;

  /** IP address */
  ipAddress?: string;

  /** Geographic location (city, country) */
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };

  /** Device type (mobile, desktop, tablet) */
  device?: string;

  /** Email client (Gmail, Outlook, Apple Mail) */
  emailClient?: string;

  /** Clicked URL (for click events) */
  clickedUrl?: string;

  /** Bounce reason (for bounce events) */
  bounceReason?: string;

  /** Bounce type (hard, soft, spam) */
  bounceType?: 'hard' | 'soft' | 'spam';
}
