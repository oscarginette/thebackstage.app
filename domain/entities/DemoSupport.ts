/**
 * DemoSupport Entity
 *
 * Domain entity representing DJ support for a demo (manual tracking).
 * Tracks how DJs support demos (radio play, DJ sets, playlists, social shares, etc).
 * Follows Clean Architecture principles with zero infrastructure dependencies.
 */

import { DEMO_SUPPORT_TYPES, type DemoSupportType } from '../types/demo-types';

/**
 * Input for creating a new demo support record
 */
export interface CreateDemoSupportInput {
  id: string;
  demoId: string;
  contactId: number;
  userId: string;
  supportType: DemoSupportType;
  platform?: string | null;
  eventName?: string | null;
  playedAt?: Date | null;
  proofUrl?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Field length constraints
 */
const MAX_PLATFORM_LENGTH = 255;
const MAX_EVENT_NAME_LENGTH = 500;

/**
 * DemoSupport Entity
 *
 * Represents a DJ's support for a demo (manually tracked by artist).
 * Examples: Radio play, DJ set play, playlist addition, social media share.
 * Immutable entity with validation in constructor.
 */
export class DemoSupport {
  constructor(
    public readonly id: string,
    public readonly demoId: string,
    public readonly contactId: number,
    public readonly userId: string,
    public readonly supportType: DemoSupportType,
    public readonly platform: string | null,
    public readonly eventName: string | null,
    public readonly playedAt: Date | null,
    public readonly proofUrl: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  /**
   * Validates all demo support fields
   * @throws Error with descriptive message if validation fails
   */
  private validate(): void {
    // Support type validation (must use typed constants)
    const validSupportTypes: DemoSupportType[] = [
      DEMO_SUPPORT_TYPES.RADIO,
      DEMO_SUPPORT_TYPES.DJ_SET,
      DEMO_SUPPORT_TYPES.PLAYLIST,
      DEMO_SUPPORT_TYPES.SOCIAL_MEDIA,
      DEMO_SUPPORT_TYPES.PODCAST,
      DEMO_SUPPORT_TYPES.OTHER,
    ];

    if (!validSupportTypes.includes(this.supportType)) {
      throw new Error(
        `Invalid demo support type: ${this.supportType}. Must be one of: ${validSupportTypes.join(', ')}`
      );
    }

    // Platform validation (optional)
    if (this.platform !== null && this.platform.length > MAX_PLATFORM_LENGTH) {
      throw new Error(`Platform cannot exceed ${MAX_PLATFORM_LENGTH} characters`);
    }

    // Event name validation (optional)
    if (this.eventName !== null && this.eventName.length > MAX_EVENT_NAME_LENGTH) {
      throw new Error(`Event name cannot exceed ${MAX_EVENT_NAME_LENGTH} characters`);
    }

    // playedAt validation (cannot be in the future)
    if (this.playedAt !== null) {
      const now = new Date();
      if (this.playedAt > now) {
        throw new Error('Played date cannot be in the future');
      }
    }

    // Proof URL validation (must be valid URL if provided)
    if (this.proofUrl !== null) {
      try {
        new URL(this.proofUrl);
      } catch {
        throw new Error('Invalid proof URL format');
      }
    }
  }

  /**
   * Factory method to create a new demo support record
   *
   * @param input - Demo support creation input
   * @returns New DemoSupport instance
   * @throws Error if validation fails
   */
  static create(input: CreateDemoSupportInput): DemoSupport {
    return new DemoSupport(
      input.id,
      input.demoId,
      input.contactId,
      input.userId,
      input.supportType,
      input.platform ?? null,
      input.eventName ?? null,
      input.playedAt ?? null,
      input.proofUrl ?? null,
      input.notes ?? null,
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date()
    );
  }

  /**
   * Factory method to reconstruct demo support from database row
   *
   * @param row - Database row
   * @returns DemoSupport instance
   * @throws Error if validation fails
   */
  static fromDatabase(row: {
    id: string;
    demo_id: string;
    contact_id: number;
    user_id: string;
    support_type: DemoSupportType;
    platform: string | null;
    event_name: string | null;
    played_at: Date | null;
    proof_url: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }): DemoSupport {
    return new DemoSupport(
      row.id,
      row.demo_id,
      row.contact_id,
      row.user_id,
      row.support_type,
      row.platform,
      row.event_name,
      row.played_at,
      row.proof_url,
      row.notes,
      row.created_at,
      row.updated_at
    );
  }

  /**
   * Checks if this support record has proof (URL)
   *
   * Proof can be a link to:
   * - Radio show recording
   * - DJ set recording
   * - Playlist link
   * - Social media post
   * - Podcast episode
   *
   * @returns true if proof URL is present
   */
  hasProof(): boolean {
    return this.proofUrl !== null && this.proofUrl.trim().length > 0;
  }

  /**
   * Gets display summary for the support record
   *
   * Format examples:
   * - "BBC Radio 1 - Essential Mix"
   * - "Mixcloud - Techno Sessions"
   * - "Spotify Playlist"
   * - "DJ Set"
   *
   * @returns Formatted display string
   */
  getDisplaySummary(): string {
    const parts: string[] = [];

    // Add platform if available
    if (this.platform && this.platform.trim().length > 0) {
      parts.push(this.platform.trim());
    }

    // Add event name if available
    if (this.eventName && this.eventName.trim().length > 0) {
      parts.push(this.eventName.trim());
    }

    // If we have parts, join them
    if (parts.length > 0) {
      return parts.join(' - ');
    }

    // Fallback to support type display name
    return this.getSupportTypeDisplayName();
  }

  /**
   * Gets human-readable display name for support type
   *
   * @returns Display name for support type
   */
  private getSupportTypeDisplayName(): string {
    const displayNames: Record<DemoSupportType, string> = {
      [DEMO_SUPPORT_TYPES.RADIO]: 'Radio Play',
      [DEMO_SUPPORT_TYPES.DJ_SET]: 'DJ Set',
      [DEMO_SUPPORT_TYPES.PLAYLIST]: 'Playlist',
      [DEMO_SUPPORT_TYPES.SOCIAL_MEDIA]: 'Social Media',
      [DEMO_SUPPORT_TYPES.PODCAST]: 'Podcast',
      [DEMO_SUPPORT_TYPES.OTHER]: 'Other Support',
    };

    return displayNames[this.supportType];
  }
}
