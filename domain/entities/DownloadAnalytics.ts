/**
 * DownloadAnalytics Entity
 *
 * Represents an analytics event for tracking user interactions with download gates.
 * Tracks views, submissions, and downloads with UTM parameters and geographic data.
 *
 * Clean Architecture: Domain entity with no external dependencies.
 * SOLID: Single Responsibility - Analytics event data and validation only.
 */

import { CreateAnalyticsInput, EventType } from '../types/download-gates';

export interface DownloadAnalyticsProps {
  id: number;
  gateId: number;
  eventType: EventType;
  sessionId: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  createdAt: Date;
}

export class DownloadAnalytics {
  private constructor(private readonly props: DownloadAnalyticsProps) {
    this.validate();
  }

  private validate(): void {
    // Event type validation
    const validEventTypes: EventType[] = ['view', 'submit', 'download'];
    if (!validEventTypes.includes(this.props.eventType)) {
      throw new Error(
        `Invalid eventType: must be one of ${validEventTypes.join(', ')}`
      );
    }

    // Country code validation (if provided, must be 2 characters)
    if (this.props.country !== null && this.props.country.length !== 2) {
      throw new Error('Invalid country: must be 2-character ISO code (e.g., "US")');
    }
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get gateId(): number {
    return this.props.gateId;
  }

  get eventType(): EventType {
    return this.props.eventType;
  }

  get sessionId(): string | null {
    return this.props.sessionId;
  }

  get referrer(): string | null {
    return this.props.referrer;
  }

  get utmSource(): string | null {
    return this.props.utmSource;
  }

  get utmMedium(): string | null {
    return this.props.utmMedium;
  }

  get utmCampaign(): string | null {
    return this.props.utmCampaign;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get country(): string | null {
    return this.props.country;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business logic methods

  /**
   * Check if this event has UTM tracking parameters
   * @returns True if any UTM parameter is present
   */
  hasUTMTracking(): boolean {
    return !!(
      this.props.utmSource ||
      this.props.utmMedium ||
      this.props.utmCampaign
    );
  }

  /**
   * Get UTM parameters as an object
   * Useful for analytics dashboards
   */
  getUTMParameters(): {
    source: string | null;
    medium: string | null;
    campaign: string | null;
  } {
    return {
      source: this.props.utmSource,
      medium: this.props.utmMedium,
      campaign: this.props.utmCampaign,
    };
  }

  // Static factory methods

  /**
   * Create DownloadAnalytics entity from database row
   * Used by repositories when fetching from database
   */
  static fromDatabase(row: any): DownloadAnalytics {
    return new DownloadAnalytics({
      id: row.id,
      gateId: row.gate_id,
      eventType: row.event_type,
      sessionId: row.session_id ?? null,
      referrer: row.referrer ?? null,
      utmSource: row.utm_source ?? null,
      utmMedium: row.utm_medium ?? null,
      utmCampaign: row.utm_campaign ?? null,
      ipAddress: row.ip_address ?? null,
      userAgent: row.user_agent ?? null,
      country: row.country ?? null,
      createdAt: new Date(row.created_at),
    });
  }

  /**
   * Create new DownloadAnalytics entity
   * Used when tracking analytics events
   * @param input - Analytics event input
   * @returns DownloadAnalytics entity
   */
  static createNew(input: CreateAnalyticsInput): DownloadAnalytics {
    // Validate event type
    const validEventTypes: EventType[] = ['view', 'submit', 'download'];
    if (!validEventTypes.includes(input.eventType)) {
      throw new Error(
        `Invalid eventType: must be one of ${validEventTypes.join(', ')}`
      );
    }

    // Validate country code if provided
    if (input.country && input.country.length !== 2) {
      throw new Error('Invalid country: must be 2-character ISO code');
    }

    return new DownloadAnalytics({
      id: 0, // Will be set by database
      gateId: input.gateId,
      eventType: input.eventType,
      sessionId: input.sessionId ?? null,
      referrer: input.referrer ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      country: input.country?.toUpperCase() ?? null, // Normalize to uppercase
      createdAt: new Date(),
    });
  }
}
