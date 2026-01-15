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
  senderEmail: z.string().email('Invalid sender email').optional(),
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
 * Schema for POST /api/contacts/add
 * Creates a single contact manually
 */
export const CreateContactSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  name: z.string().max(100, 'Name must be 100 characters or less').optional().nullable(),
  subscribed: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.record(z.string(), z.unknown())
  ])).optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;

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
  requireInstagramFollow: z.boolean().default(false),
  instagramProfileUrl: z.string().url('Invalid Instagram URL').optional(),
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
  requireInstagramFollow: z.boolean().optional(),
  instagramProfileUrl: z.string().url('Invalid Instagram URL').optional(),
  requireSpotifyConnect: z.boolean().optional(),
  soundcloudTrackId: z.string().optional(),
  customMessage: z.string().max(1000, 'Custom message too long').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDownloadGateInput = z.infer<typeof UpdateDownloadGateSchema>;

/**
 * Schema for POST /api/gate/[slug]/submit
 * Submits email for download gate (public endpoint)
 * Multi-brand consent: The Backstage + Gee Beat
 */
export const SubmitDownloadGateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().max(100, 'First name too long').optional(),
  consentBackstage: z.boolean({ message: 'Backstage consent must be explicitly provided' }),
  consentGeeBeat: z.boolean({ message: 'Gee Beat consent must be explicitly provided' }),
  source: z.enum(['the_backstage', 'gee_beat'], { message: 'Source must be the_backstage or gee_beat' }),
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
  mjmlContent: z.record(z.string(), z.any()).refine(
    (val) => val.tagName === 'mjml',
    { message: 'MJML content must have root tagName "mjml"' }
  ),
  htmlSnapshot: z.string().min(1, 'HTML snapshot is required'),
  isDefault: z.boolean().default(false),
  parentTemplateId: z.string().optional(),
});

export type CreateEmailTemplateInput = z.infer<typeof CreateEmailTemplateSchema>;

/**
 * Schema for PUT /api/templates/[id]
 * Updates an existing email template
 */
export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200, 'Name too long').optional(),
  description: z.string().max(1000, 'Description too long').nullable().optional(),
  mjmlContent: z.record(z.string(), z.any()).refine(
    (val) => val.tagName === 'mjml',
    { message: 'MJML content must have root tagName "mjml"' }
  ).optional(),
  htmlSnapshot: z.string().min(1, 'HTML snapshot is required').optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>;

// ============================================================================
// Email Campaigns
// ============================================================================

/**
 * Schema for POST /api/campaigns
 * Creates a new email campaign or draft
 *
 * Note: Drafts are flexible - only subject is required.
 * When status is 'sent', all fields should be validated before sending.
 */
export const CreateCampaignSchema = z.object({
  templateId: z.string().optional(),
  trackId: z.string().optional(),
  subject: z.string().max(500, 'Subject too long').optional(),
  greeting: z.string().max(200, 'Greeting too long').optional(),
  message: z.string().optional(),
  signature: z.string().max(500, 'Signature too long').optional(),
  coverImageUrl: z.string().url('Invalid cover image URL').optional().nullable(),
  // NOTE: senderEmail removed - sender is configured globally in user settings
  // Per-campaign sender selection is forbidden (see .claude/CLAUDE.md)
  htmlContent: z.string().optional(),
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
  instagramUrl: z.string().url('Invalid Instagram URL').max(500, 'Instagram URL too long').nullable().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>;

/**
 * Schema for PATCH /api/user/appearance
 * Updates user's theme preference
 */
export const UpdateUserAppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], { message: 'Invalid theme (must be light, dark, or system)' }),
});

export type UpdateUserAppearanceInput = z.infer<typeof UpdateUserAppearanceSchema>;

/**
 * Schema for PATCH /api/user/notification-preferences
 * Updates user's notification preferences
 */
export const UpdateNotificationPreferencesSchema = z.object({
  autoSendSoundcloud: z.boolean({ message: 'autoSendSoundcloud must be a boolean' }).optional(),
  autoSendSpotify: z.boolean({ message: 'autoSendSpotify must be a boolean' }).optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;

// ============================================================================
// Email Signatures
// ============================================================================

/**
 * Schema for individual social link
 * Supports free-form platform names for maximum flexibility
 */
export const SocialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform name required').max(50, 'Platform name too long'),
  url: z.string().url('Invalid URL'),
  label: z.string().min(1, 'Label required').max(50, 'Label too long'),
});

export type SocialLinkInput = z.infer<typeof SocialLinkSchema>;

/**
 * Schema for PUT /api/email-signature
 * Updates user's email signature
 */
export const EmailSignatureSchema = z.object({
  logoUrl: z.string().url('Invalid logo URL').nullable(),
  customText: z.string().max(500, 'Custom text too long').nullable(),
  socialLinks: z.array(SocialLinkSchema).max(6, 'Maximum 6 social links'),
  defaultToGeeBeat: z.boolean().default(false),
});

export type EmailSignatureInput = z.infer<typeof EmailSignatureSchema>;

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
// Demos
// ============================================================================

/**
 * Schema for POST /api/demos
 * Creates a new demo
 */
export const CreateDemoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  artistName: z.string().min(1, 'Artist name is required').max(200, 'Artist name too long'),
  fileUrl: z.string().url('Invalid file URL'),
  genre: z.string().max(100, 'Genre too long').optional(),
  bpm: z.number().int().min(1).max(999).optional(),
  key: z.string().max(10, 'Key too long').optional(),
  releaseDate: z.string().optional(),
  label: z.string().max(200, 'Label too long').optional(),
  notes: z.string().optional(),
});

export type CreateDemoInput = z.infer<typeof CreateDemoSchema>;

/**
 * Schema for PATCH /api/demos/[demoId]
 * Updates an existing demo
 */
export const UpdateDemoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  artistName: z.string().min(1, 'Artist name is required').max(200, 'Artist name too long').optional(),
  fileUrl: z.string().url('Invalid file URL').optional(),
  genre: z.string().max(100, 'Genre too long').optional(),
  bpm: z.number().int().min(1).max(999).optional(),
  key: z.string().max(10, 'Key too long').optional(),
  releaseDate: z.string().optional(),
  label: z.string().max(200, 'Label too long').optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

export type UpdateDemoInput = z.infer<typeof UpdateDemoSchema>;

/**
 * Schema for POST /api/demos/[demoId]/send
 * Sends demo to DJ contacts
 */
export const SendDemoSchema = z.object({
  contactIds: z.array(z.number().int().positive('Invalid contact ID')).min(1, 'At least one contact is required'),
  emailSubject: z.string().min(1, 'Email subject is required').max(500, 'Subject too long'),
  emailBodyHtml: z.string().min(1, 'Email body is required'),
  personalNote: z.string().max(1000, 'Personal note too long').optional(),
});

export type SendDemoInput = z.infer<typeof SendDemoSchema>;

/**
 * Schema for POST /api/demos/[demoId]/supports
 * Records DJ support for a demo
 */
export const RecordDemoSupportSchema = z.object({
  contactId: z.number().int().positive('Invalid contact ID'),
  supportType: z.enum(['radio', 'dj_set', 'playlist', 'social_media', 'podcast', 'other'], {
    message: 'Invalid support type',
  }),
  platform: z.string().max(100, 'Platform too long').optional(),
  eventName: z.string().max(200, 'Event name too long').optional(),
  playedAt: z.string().datetime('Invalid datetime format').optional(),
  proofUrl: z.string().url('Invalid proof URL').optional(),
  notes: z.string().optional(),
});

export type RecordDemoSupportInput = z.infer<typeof RecordDemoSupportSchema>;

/**
 * Schema for POST /api/demo-sends/[sendId]/track
 * Tracks demo email events (open/click)
 */
export const TrackDemoEventSchema = z.object({
  event: z.enum(['open', 'click'], { message: 'Invalid event type' }),
  timestamp: z.string().datetime('Invalid timestamp format').optional(),
});

export type TrackDemoEventInput = z.infer<typeof TrackDemoEventSchema>;

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
// Contact Lists
// ============================================================================

/**
 * Schema for POST /api/contact-lists
 * Creates a new contact list
 */
export const CreateContactListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be #RRGGBB)').optional(),
});

export type CreateContactListInput = z.infer<typeof CreateContactListSchema>;

/**
 * Schema for PATCH /api/contact-lists/[id]
 * Updates an existing contact list
 */
export const UpdateContactListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be #RRGGBB)').optional(),
});

export type UpdateContactListInput = z.infer<typeof UpdateContactListSchema>;

/**
 * Schema for POST /api/contact-lists/[id]/add-contacts
 * Add contacts to a list
 */
export const AddContactsToListSchema = z.object({
  contactIds: z.array(z.number().int().positive('Invalid contact ID')).min(1, 'At least one contact is required').max(1000, 'Too many contacts (max 1000)'),
});

export type AddContactsToListInput = z.infer<typeof AddContactsToListSchema>;

/**
 * Schema for POST /api/contact-lists/[id]/remove-contacts
 * Remove contacts from a list
 */
export const RemoveContactsFromListSchema = z.object({
  contactIds: z.array(z.number().int().positive('Invalid contact ID')).min(1, 'At least one contact is required').max(1000, 'Too many contacts (max 1000)'),
});

export type RemoveContactsFromListInput = z.infer<typeof RemoveContactsFromListSchema>;

/**
 * Schema for POST /api/contacts/add-to-lists
 * Add contacts to multiple lists
 */
export const AddContactsToMultipleListsSchema = z.object({
  contactIds: z.array(z.number().int().positive('Invalid contact ID')).min(1, 'At least one contact is required').max(1000, 'Too many contacts (max 1000)'),
  listIds: z.array(z.string().min(1, 'Invalid list ID')).min(1, 'At least one list is required').max(50, 'Too many lists (max 50)'),
});

export type AddContactsToMultipleListsInput = z.infer<typeof AddContactsToMultipleListsSchema>;

// ============================================================================
// Admin - User Management
// ============================================================================

/**
 * Schema for POST /api/admin/promote-user
 * Promotes a user to admin role
 */
export const PromoteUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  secret: z.string().min(1, 'Secret is required'),
});

export type PromoteUserInput = z.infer<typeof PromoteUserSchema>;

/**
 * Schema for POST /api/admin/users/delete
 * Deletes multiple users
 */
export const DeleteUsersSchema = z.object({
  ids: z.array(z.number().int().positive('Invalid user ID')).min(1, 'At least one user ID is required').max(100, 'Too many users to delete at once (max 100)'),
});

export type DeleteUsersInput = z.infer<typeof DeleteUsersSchema>;

/**
 * Schema for PATCH /api/admin/users/[userId]/quota
 * Updates user's monthly email quota
 */
export const UpdateUserQuotaSchema = z.object({
  monthlyQuota: z.number().int().min(0, 'Quota cannot be negative').max(1000000, 'Quota too high'),
});

export type UpdateUserQuotaInput = z.infer<typeof UpdateUserQuotaSchema>;

/**
 * Schema for POST /api/admin/users/[userId]/toggle
 * Toggles user active status
 */
export const ToggleUserStatusSchema = z.object({
  active: z.boolean({ message: 'Active status must be a boolean' }),
});

export type ToggleUserStatusInput = z.infer<typeof ToggleUserStatusSchema>;

/**
 * Schema for POST /api/admin/users/bulk-activate
 * Bulk activate users
 */
export const BulkActivateUsersSchema = z.object({
  userIds: z.array(z.number().int().positive('Invalid user ID')).min(1, 'At least one user ID is required').max(100, 'Too many users (max 100)'),
  plan: z.enum(['free', 'pro', 'business', 'unlimited'], { message: 'Invalid subscription plan' }),
  billingCycle: z.enum(['monthly', 'annual'], { message: 'Invalid billing cycle' }).optional(),
  durationMonths: z.number().int().min(1, 'Duration must be at least 1 month').max(12, 'Duration cannot exceed 12 months'),
});

export type BulkActivateUsersInput = z.infer<typeof BulkActivateUsersSchema>;

// ============================================================================
// Subscriptions
// ============================================================================

/**
 * Schema for POST /api/subscriptions
 * Creates a new subscription
 */
export const CreateSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required').max(255, 'Price ID too long'),
  trialDays: z.number().int().min(0, 'Trial days cannot be negative').max(365, 'Trial period too long').optional().default(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

// ============================================================================
// Campaign Query Parameters
// ============================================================================

/**
 * Schema for GET /api/campaigns query parameters
 */
export const GetCampaignsQuerySchema = z.object({
  status: z.enum(['draft', 'sent'], { message: 'Invalid status (must be draft or sent)' }).nullable().optional(),
  trackId: z.string().max(255, 'Track ID too long').nullable().optional(),
  templateId: z.string().max(255, 'Template ID too long').nullable().optional(),
  scheduledOnly: z.enum(['true', 'false'], { message: 'Invalid boolean value' }).nullable().optional(),
});

export type GetCampaignsQueryInput = z.infer<typeof GetCampaignsQuerySchema>;

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
