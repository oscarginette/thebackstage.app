/**
 * DemoSend Entity
 *
 * Domain entity representing a demo sent to a DJ contact.
 * Tracks email delivery, opens, and clicks for engagement analytics.
 * Follows Clean Architecture principles with zero infrastructure dependencies.
 */

import { DEMO_SEND_STATUS, type DemoSendStatus, type DemoSendMetadata } from '../types/demo-types';

/**
 * Input for creating a new demo send
 */
export interface CreateDemoSendInput {
  id: string;
  demoId: string;
  contactId: number;
  userId: string;
  emailSubject: string;
  emailBodyHtml: string;
  personalNote?: string | null;
  status?: DemoSendStatus;
  sentAt: Date;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  resendEmailId?: string | null;
  metadata?: DemoSendMetadata | null;
  createdAt?: Date;
}

/**
 * Field length constraints
 */
const MAX_EMAIL_SUBJECT_LENGTH = 500;

/**
 * DemoSend Entity
 *
 * Represents a demo that has been sent to a DJ contact.
 * Tracks engagement (opens, clicks) for analytics.
 * Immutable entity with validation in constructor.
 */
export class DemoSend {
  constructor(
    public readonly id: string,
    public readonly demoId: string,
    public readonly contactId: number,
    public readonly userId: string,
    public readonly emailSubject: string,
    public readonly emailBodyHtml: string,
    public readonly personalNote: string | null,
    public readonly status: DemoSendStatus,
    public readonly sentAt: Date,
    public readonly openedAt: Date | null,
    public readonly clickedAt: Date | null,
    public readonly resendEmailId: string | null,
    public readonly metadata: DemoSendMetadata | null,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  /**
   * Validates all demo send fields
   * @throws Error with descriptive message if validation fails
   */
  private validate(): void {
    // Email subject validation
    if (!this.emailSubject || this.emailSubject.trim().length === 0) {
      throw new Error('Email subject cannot be empty');
    }
    if (this.emailSubject.length > MAX_EMAIL_SUBJECT_LENGTH) {
      throw new Error(`Email subject cannot exceed ${MAX_EMAIL_SUBJECT_LENGTH} characters`);
    }

    // Email body validation
    if (!this.emailBodyHtml || this.emailBodyHtml.trim().length === 0) {
      throw new Error('Email body HTML cannot be empty');
    }

    // Status validation (must use typed constants)
    const validStatuses: DemoSendStatus[] = [
      DEMO_SEND_STATUS.SENT,
      DEMO_SEND_STATUS.OPENED,
      DEMO_SEND_STATUS.CLICKED,
    ];

    if (!validStatuses.includes(this.status)) {
      throw new Error(
        `Invalid demo send status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    // sentAt validation (cannot be in the future)
    const now = new Date();
    if (this.sentAt > now) {
      throw new Error('Demo send date cannot be in the future');
    }

    // openedAt validation (must be >= sentAt if present)
    if (this.openedAt !== null) {
      if (this.openedAt < this.sentAt) {
        throw new Error('Demo open date cannot be before send date');
      }
    }

    // clickedAt validation (must be >= sentAt if present)
    if (this.clickedAt !== null) {
      if (this.clickedAt < this.sentAt) {
        throw new Error('Demo click date cannot be before send date');
      }
    }

    // Status consistency validation
    if (this.status === DEMO_SEND_STATUS.OPENED && this.openedAt === null) {
      throw new Error('Status is "opened" but openedAt is null');
    }
    if (this.status === DEMO_SEND_STATUS.CLICKED && this.clickedAt === null) {
      throw new Error('Status is "clicked" but clickedAt is null');
    }
  }

  /**
   * Factory method to create a new demo send
   *
   * @param input - Demo send creation input
   * @returns New DemoSend instance
   * @throws Error if validation fails
   */
  static createNew(input: CreateDemoSendInput): DemoSend {
    return new DemoSend(
      input.id,
      input.demoId,
      input.contactId,
      input.userId,
      input.emailSubject,
      input.emailBodyHtml,
      input.personalNote ?? null,
      input.status ?? DEMO_SEND_STATUS.SENT,
      input.sentAt,
      input.openedAt ?? null,
      input.clickedAt ?? null,
      input.resendEmailId ?? null,
      input.metadata ?? null,
      input.createdAt ?? new Date()
    );
  }

  /**
   * Factory method to reconstruct demo send from database row
   *
   * @param row - Database row
   * @returns DemoSend instance
   * @throws Error if validation fails
   */
  static fromDatabase(row: {
    id: string;
    demo_id: string;
    contact_id: number;
    user_id: string;
    email_subject: string;
    email_body_html: string;
    personal_note: string | null;
    status: DemoSendStatus;
    sent_at: Date;
    opened_at: Date | null;
    clicked_at: Date | null;
    resend_email_id: string | null;
    metadata: DemoSendMetadata | null;
    created_at: Date;
  }): DemoSend {
    return new DemoSend(
      row.id,
      row.demo_id,
      row.contact_id,
      row.user_id,
      row.email_subject,
      row.email_body_html,
      row.personal_note,
      row.status,
      row.sent_at,
      row.opened_at,
      row.clicked_at,
      row.resend_email_id,
      row.metadata,
      row.created_at
    );
  }

  /**
   * Marks the demo send as opened
   *
   * Updates status and openedAt timestamp.
   * If already opened, this is a no-op (idempotent).
   *
   * @param timestamp - When the demo was opened
   * @throws Error if timestamp is before sentAt
   */
  markAsOpened(timestamp: Date): DemoSend {
    // Already opened, no-op
    if (this.openedAt !== null) {
      return this;
    }

    // Validate timestamp
    if (timestamp < this.sentAt) {
      throw new Error('Open timestamp cannot be before send date');
    }

    // Return new instance with updated state
    return new DemoSend(
      this.id,
      this.demoId,
      this.contactId,
      this.userId,
      this.emailSubject,
      this.emailBodyHtml,
      this.personalNote,
      DEMO_SEND_STATUS.OPENED,
      this.sentAt,
      timestamp,
      this.clickedAt,
      this.resendEmailId,
      this.metadata,
      this.createdAt
    );
  }

  /**
   * Marks the demo send as clicked
   *
   * Updates status and clickedAt timestamp.
   * Also marks as opened if not already opened.
   * If already clicked, this is a no-op (idempotent).
   *
   * @param timestamp - When the demo was clicked
   * @throws Error if timestamp is before sentAt
   */
  markAsClicked(timestamp: Date): DemoSend {
    // Already clicked, no-op
    if (this.clickedAt !== null) {
      return this;
    }

    // Validate timestamp
    if (timestamp < this.sentAt) {
      throw new Error('Click timestamp cannot be before send date');
    }

    // If not opened yet, mark as opened with same timestamp
    const openedAt = this.openedAt ?? timestamp;

    // Return new instance with updated state
    return new DemoSend(
      this.id,
      this.demoId,
      this.contactId,
      this.userId,
      this.emailSubject,
      this.emailBodyHtml,
      this.personalNote,
      DEMO_SEND_STATUS.CLICKED,
      this.sentAt,
      openedAt,
      timestamp,
      this.resendEmailId,
      this.metadata,
      this.createdAt
    );
  }

  /**
   * Checks if the demo was opened
   *
   * @returns true if demo was opened
   */
  wasOpened(): boolean {
    return this.openedAt !== null;
  }

  /**
   * Checks if the demo was clicked
   *
   * @returns true if demo was clicked
   */
  wasClicked(): boolean {
    return this.clickedAt !== null;
  }

  /**
   * Calculates engagement score for analytics
   *
   * Score progression:
   * - 0: Sent only (no engagement)
   * - 50: Opened (viewed email)
   * - 100: Clicked (listened to demo)
   *
   * @returns Engagement score (0, 50, or 100)
   */
  getEngagementScore(): number {
    if (this.wasClicked()) {
      return 100;
    }

    if (this.wasOpened()) {
      return 50;
    }

    return 0;
  }
}
