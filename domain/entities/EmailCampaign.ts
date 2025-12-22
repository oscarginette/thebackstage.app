/**
 * EmailCampaign Entity
 *
 * Represents an email campaign or draft that can be sent independently
 * of tracks. Supports both custom emails and template-based emails.
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages campaign business logic and validation
 * - Open/Closed: Can be extended without modification
 */

export interface EmailCampaignProps {
  id: string;
  templateId: string | null;
  trackId: string | null;
  subject: string;
  htmlContent: string;
  status: 'draft' | 'sent';
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailCampaign {
  constructor(
    public readonly id: string,
    public readonly templateId: string | null,
    public readonly trackId: string | null,
    public readonly subject: string,
    public readonly htmlContent: string,
    public readonly status: 'draft' | 'sent',
    public readonly scheduledAt: Date | null,
    public readonly sentAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  /**
   * Validate campaign business rules
   * @throws Error if validation fails
   */
  private validate(): void {
    // Subject validation
    if (!this.subject || this.subject.trim().length === 0) {
      throw new Error('Campaign subject cannot be empty');
    }

    if (this.subject.length > 500) {
      throw new Error('Campaign subject cannot exceed 500 characters');
    }

    // HTML content validation
    if (!this.htmlContent || this.htmlContent.trim().length === 0) {
      throw new Error('Campaign HTML content cannot be empty');
    }

    // Status validation
    if (!['draft', 'sent'].includes(this.status)) {
      throw new Error('Campaign status must be either "draft" or "sent"');
    }

    // Business rule: sent campaigns must have sentAt timestamp
    if (this.status === 'sent' && !this.sentAt) {
      throw new Error('Sent campaigns must have a sentAt timestamp');
    }

    // Business rule: draft campaigns cannot have sentAt timestamp
    if (this.status === 'draft' && this.sentAt) {
      throw new Error('Draft campaigns cannot have a sentAt timestamp');
    }

    // Scheduled validation
    if (this.scheduledAt && this.scheduledAt < new Date()) {
      // Allow past scheduled dates for campaigns that should have been sent
      // This is a warning condition, not an error
    }
  }

  /**
   * Check if campaign is a draft
   */
  isDraft(): boolean {
    return this.status === 'draft';
  }

  /**
   * Check if campaign has been sent
   */
  isSent(): boolean {
    return this.status === 'sent';
  }

  /**
   * Check if campaign is scheduled for future sending
   */
  isScheduled(): boolean {
    return this.scheduledAt !== null && this.scheduledAt > new Date();
  }

  /**
   * Check if campaign is linked to a track
   */
  hasTrack(): boolean {
    return this.trackId !== null;
  }

  /**
   * Check if campaign is based on a template
   */
  hasTemplate(): boolean {
    return this.templateId !== null;
  }

  /**
   * Check if campaign is a custom email (no template, no track)
   */
  isCustomEmail(): boolean {
    return !this.hasTemplate() && !this.hasTrack();
  }

  /**
   * Get campaign summary for display purposes
   */
  getSummary(): {
    id: string;
    subject: string;
    status: 'draft' | 'sent';
    createdAt: Date;
    scheduledAt: Date | null;
  } {
    return {
      id: this.id,
      subject: this.subject,
      status: this.status,
      createdAt: this.createdAt,
      scheduledAt: this.scheduledAt
    };
  }

  /**
   * Create a new EmailCampaign instance
   * Factory method following clean code practices
   */
  static create(props: {
    templateId?: string | null;
    trackId?: string | null;
    subject: string;
    htmlContent: string;
    status?: 'draft' | 'sent';
    scheduledAt?: Date | null;
  }): EmailCampaign {
    const id = crypto.randomUUID();
    const now = new Date();

    return new EmailCampaign(
      id,
      props.templateId || null,
      props.trackId || null,
      props.subject,
      props.htmlContent,
      props.status || 'draft',
      props.scheduledAt || null,
      props.status === 'sent' ? now : null,
      now,
      now
    );
  }

  /**
   * Mark campaign as sent
   * Returns new instance (immutability)
   */
  markAsSent(): EmailCampaign {
    if (this.status === 'sent') {
      throw new Error('Campaign is already marked as sent');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      'sent',
      this.scheduledAt,
      now,
      this.createdAt,
      now
    );
  }

  /**
   * Update campaign properties (only drafts can be updated)
   * Returns new instance (immutability)
   */
  update(props: {
    subject?: string;
    htmlContent?: string;
    scheduledAt?: Date | null;
  }): EmailCampaign {
    if (this.status === 'sent') {
      throw new Error('Cannot update a sent campaign');
    }

    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      props.subject !== undefined ? props.subject : this.subject,
      props.htmlContent !== undefined ? props.htmlContent : this.htmlContent,
      this.status,
      props.scheduledAt !== undefined ? props.scheduledAt : this.scheduledAt,
      this.sentAt,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Convert to plain object for database storage
   */
  toJSON(): EmailCampaignProps {
    return {
      id: this.id,
      templateId: this.templateId,
      trackId: this.trackId,
      subject: this.subject,
      htmlContent: this.htmlContent,
      status: this.status,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row: any): EmailCampaign {
    return new EmailCampaign(
      row.id,
      row.template_id,
      row.track_id,
      row.subject,
      row.html_content,
      row.status,
      row.scheduled_at ? new Date(row.scheduled_at) : null,
      row.sent_at ? new Date(row.sent_at) : null,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
