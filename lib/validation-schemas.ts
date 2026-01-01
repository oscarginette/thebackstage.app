/**
 * Zod validation schemas for API endpoints
 *
 * These schemas provide type-safe validation for all API request bodies.
 * They enforce data integrity, provide clear error messages, and enable
 * automatic TypeScript type inference.
 *
 * Clean Architecture: Validation is a cross-cutting concern.
 * These schemas can be used in both API routes and Use Cases.
 */

import { z } from 'zod';

// ============================================================================
// Email & Track Sending
// ============================================================================

/**
 * Schema for POST /api/send-track
 * Sends new track email to all subscribed contacts
 */
export const SendTrackSchema = z.object({
  trackId: z.string().min(1, 'Track ID is required'),
  title: z.string().min(1, 'Track title is required').max(500, 'Title too long'),
  url: z.string().url('Invalid track URL'),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  publishedAt: z.string().min(1, 'Published date is required'),
  customContent: z.object({
    subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long').optional(),
    greeting: z.string().max(200, 'Greeting too long').optional(),
    message: z.string().optional(),
    signature: z.string().max(500, 'Signature too long').optional(),
  }).optional(),
});

export type SendTrackInput = z.infer<typeof SendTrackSchema>;

/**
 * Schema for POST /api/send-custom-email
 * Sends custom email to all subscribed contacts
 */
export const SendCustomEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  greeting: z.string().min(1, 'Greeting is required').max(200, 'Greeting too long'),
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required').max(500, 'Signature too long'),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  saveAsDraft: z.boolean().default(false),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime('Invalid datetime format').optional(),
});

export type SendCustomEmailInput = z.infer<typeof SendCustomEmailSchema>;

// ============================================================================
// Contact Management
// ============================================================================

/**
 * Schema for POST /api/contacts/import/execute
 * Executes contact import with column mapping
 */
export const ImportContactsSchema = z.object({
  rawData: z.array(z.record(z.string(), z.any())).min(1, 'No data provided'),
  columnMapping: z.object({
    emailColumn: z.string().min(1, 'Email column is required'),
    nameColumn: z.string().nullish(),
    subscribedColumn: z.string().nullish(),
    metadataColumns: z.array(z.string()).optional().default([]),
  }),
  fileMetadata: z.object({
    filename: z.string().min(1, 'Filename is required'),
    fileType: z.string().min(1, 'File type is required'),
    fileSizeBytes: z.number().int().positive('File size must be positive'),
  }),
});

export type ImportContactsInput = z.infer<typeof ImportContactsSchema>;

/**
 * Schema for POST /api/contacts/delete
 * Deletes multiple contacts by IDs
 */
export const DeleteContactsSchema = z.object({
  ids: z.array(z.number().int().positive('Invalid contact ID')).min(1, 'At least one contact ID is required'),
});

export type DeleteContactsInput = z.infer<typeof DeleteContactsSchema>;

// ============================================================================
// Download Gates
// ============================================================================

/**
 * Schema for POST /api/download-gates
 * Creates a new download gate
 */
export const CreateDownloadGateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  artistName: z.string().max(200, 'Artist name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.enum(['audio', 'video', 'image', 'document', 'other']).default('audio'),
  artworkUrl: z.string().url('Invalid artwork URL').optional(),
  collectEmail: z.boolean().default(true),
  collectName: z.boolean().default(false),
  requireSoundcloudRepost: z.boolean().default(false),
  requireSoundcloudFollow: z.boolean().default(false),
  requireSpotifyConnect: z.boolean().default(false),
  soundcloudTrackId: z.string().optional(),
  customMessage: z.string().max(1000, 'Custom message too long').optional(),
  isActive: z.boolean().default(true),
});

export type CreateDownloadGateInput = z.infer<typeof CreateDownloadGateSchema>;

/**
 * Schema for PATCH /api/download-gates/[id]
 * Updates an existing download gate
 */
export const UpdateDownloadGateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  artistName: z.string().max(200, 'Artist name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  fileUrl: z.string().url('Invalid file URL').optional(),
  fileType: z.enum(['audio', 'video', 'image', 'document', 'other']).optional(),
  artworkUrl: z.string().url('Invalid artwork URL').optional(),
  collectEmail: z.boolean().optional(),
  collectName: z.boolean().optional(),
  requireSoundcloudRepost: z.boolean().optional(),
  requireSoundcloudFollow: z.boolean().optional(),
  requireSpotifyConnect: z.boolean().optional(),
  soundcloudTrackId: z.string().optional(),
  customMessage: z.string().max(1000, 'Custom message too long').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDownloadGateInput = z.infer<typeof UpdateDownloadGateSchema>;

/**
 * Schema for POST /api/gate/[slug]/submit
 * Submits email for download gate (public endpoint)
 */
export const SubmitDownloadGateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().max(100, 'First name too long').optional(),
  consentMarketing: z.boolean({ message: 'Marketing consent is required' }),
});

export type SubmitDownloadGateInput = z.infer<typeof SubmitDownloadGateSchema>;

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Schema for POST /api/templates
 * Creates a new email template
 */
export const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  jsonContent: z.record(z.string(), z.any()).optional(),
  isPublic: z.boolean().default(false),
  category: z.string().max(50, 'Category too long').optional(),
});

export type CreateEmailTemplateInput = z.infer<typeof CreateEmailTemplateSchema>;

/**
 * Schema for PUT /api/templates/[id]
 * Updates an existing email template
 */
export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long').optional(),
  htmlContent: z.string().min(1, 'HTML content is required').optional(),
  jsonContent: z.record(z.string(), z.any()).optional(),
  isPublic: z.boolean().optional(),
  category: z.string().max(50, 'Category too long').optional(),
});

export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>;

// ============================================================================
// Email Campaigns
// ============================================================================

/**
 * Schema for POST /api/campaigns
 * Creates a new email campaign or draft
 */
export const CreateCampaignSchema = z.object({
  templateId: z.string().optional(),
  trackId: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  status: z.enum(['draft', 'sent']).default('draft'),
  scheduledAt: z.string().datetime('Invalid datetime format').optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

// ============================================================================
// User Settings
// ============================================================================

/**
 * Schema for PATCH /api/user/settings
 * Updates user settings
 */
export const UpdateUserSettingsSchema = z.object({
  name: z.string().max(200, 'Name too long').nullable().optional(),
  soundcloudId: z.string().max(100, 'SoundCloud ID too long').nullable().optional(),
  soundcloudUrl: z.string().max(500, 'SoundCloud URL too long').nullable().optional(),
  spotifyId: z.string().max(100, 'Spotify ID too long').nullable().optional(),
  spotifyUrl: z.string().max(500, 'Spotify URL too long').nullable().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;

// ============================================================================
// Integrations
// ============================================================================

/**
 * Schema for POST /api/integrations/brevo/connect
 * Connects Brevo account with API key
 */
export const ConnectBrevoSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').trim(),
});

export type ConnectBrevoInput = z.infer<typeof ConnectBrevoSchema>;

// ============================================================================
// Webhooks
// ============================================================================

/**
 * Schema for POST /api/webhooks/resend
 * Handles Resend email events
 */
export const ResendWebhookSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.bounced',
    'email.opened',
    'email.clicked',
  ]),
  data: z.record(z.string(), z.any()),
});

export type ResendWebhookInput = z.infer<typeof ResendWebhookSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Generic validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: any };

/**
 * Helper function to validate data against a schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with typed data or error
 *
 * @example
 * const result = validate(SendTrackSchema, body);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
 * }
 * const validatedData = result.data; // Type-safe!
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      details: validation.error.format(),
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}

/**
 * Helper function for use in API routes
 * Validates request body and returns NextResponse on error
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws with formatted error response
 *
 * @example
 * const validatedData = validateOrThrow(SendTrackSchema, body);
 * // Use validatedData directly, errors are automatically handled
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    const error = new Error('Validation failed');
    (error as any).zodError = validation.error.format();
    (error as any).statusCode = 400;
    throw error;
  }

  return validation.data;
}
