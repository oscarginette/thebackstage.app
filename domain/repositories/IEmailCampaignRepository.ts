/**
 * IEmailCampaignRepository Interface
 *
 * Defines the contract for email campaign data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation
 *
 * Supports both drafts and sent campaigns management.
 */

export interface EmailCampaign {
  id: string;
  templateId: string | null;
  trackId: string | null;
  subject: string | null;  // Can be null for drafts
  greeting?: string | null;  // Optional email greeting
  message?: string | null;   // Optional email message
  signature?: string | null; // Optional email signature
  htmlContent: string | null;  // Can be null for drafts
  status: 'draft' | 'sent';
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput {
  userId: number;  // Multi-tenant: User who owns this campaign
  templateId?: string | null;
  trackId?: string | null;
  subject?: string;  // Optional for drafts
  greeting?: string;  // Optional email greeting
  message?: string;   // Optional email message
  signature?: string; // Optional email signature
  htmlContent?: string;  // Optional for drafts, required for sent
  status?: 'draft' | 'sent';
  scheduledAt?: Date | null;
}

export interface UpdateCampaignInput {
  id: string;
  subject?: string;
  htmlContent?: string;
  status?: 'draft' | 'sent';
  scheduledAt?: Date | null;
  sentAt?: Date | null;
}

export interface FindCampaignsOptions {
  userId?: number;  // Multi-tenant: Filter by user ID
  status?: 'draft' | 'sent';
  trackId?: string;
  templateId?: string;
  scheduledOnly?: boolean;
}

/**
 * Repository interface for EmailCampaign
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IEmailCampaignRepository {
  /**
   * Create a new campaign
   * @param input Campaign creation data
   * @returns Created campaign
   */
  create(input: CreateCampaignInput): Promise<EmailCampaign>;

  /**
   * Find campaign by ID
   * @param id Campaign UUID
   * @returns Campaign or null if not found
   */
  findById(id: string): Promise<EmailCampaign | null>;

  /**
   * Find all campaigns
   * @param options Query options
   * @returns Array of campaigns
   */
  findAll(options?: FindCampaignsOptions): Promise<EmailCampaign[]>;

  /**
   * Get all drafts
   * @returns Array of draft campaigns
   */
  getDrafts(): Promise<EmailCampaign[]>;

  /**
   * Get all sent campaigns
   * @returns Array of sent campaigns
   */
  getSent(): Promise<EmailCampaign[]>;

  /**
   * Get scheduled campaigns (future scheduled_at)
   * @returns Array of scheduled campaigns
   */
  getScheduled(): Promise<EmailCampaign[]>;

  /**
   * Update campaign
   * @param input Update data
   * @returns Updated campaign
   */
  update(input: UpdateCampaignInput): Promise<EmailCampaign>;

  /**
   * Delete campaign (hard delete for drafts, soft delete for sent)
   * @param id Campaign UUID
   */
  delete(id: string): Promise<void>;

  /**
   * Mark campaign as sent
   * @param id Campaign UUID
   * @returns Updated campaign
   */
  markAsSent(id: string): Promise<EmailCampaign>;

  /**
   * Find campaigns by track ID
   * @param trackId Track ID
   * @returns Array of campaigns linked to this track
   */
  findByTrackId(trackId: string): Promise<EmailCampaign[]>;

  /**
   * Find campaigns by template ID
   * @param templateId Template UUID
   * @returns Array of campaigns using this template
   */
  findByTemplateId(templateId: string): Promise<EmailCampaign[]>;

  /**
   * Count total campaigns
   * @param status Optional status filter
   * @returns Count of campaigns
   */
  count(status?: 'draft' | 'sent'): Promise<number>;

  /**
   * Check if a campaign exists
   * @param id Campaign UUID
   * @returns True if campaign exists
   */
  exists(id: string): Promise<boolean>;
}
