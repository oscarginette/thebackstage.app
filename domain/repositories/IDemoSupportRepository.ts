/**
 * IDemoSupportRepository
 *
 * Repository interface for DemoSupport entity following Dependency Inversion Principle.
 * Defines contracts for demo support tracking and analytics with zero implementation details.
 *
 * Clean Architecture: Domain layer defines interface, infrastructure layer implements it.
 */

import type { DemoSupport } from '../entities/DemoSupport';
import type { DemoSupportType } from '../types/demo-types';

/**
 * Input for creating a new demo support record
 */
export interface CreateDemoSupportInput {
  id: string; // UUID
  demoId: string;
  contactId: number;
  userId: number;
  supportType: DemoSupportType;
  platform?: string | null;
  eventName?: string | null;
  playedAt?: Date | null;
  proofUrl?: string | null;
  notes?: string | null;
}

/**
 * Input for updating an existing demo support record
 */
export interface UpdateDemoSupportInput {
  supportType?: DemoSupportType;
  platform?: string | null;
  eventName?: string | null;
  playedAt?: Date | null;
  proofUrl?: string | null;
  notes?: string | null;
}

/**
 * Demo support statistics for analytics
 */
export interface DemoSupportStats {
  totalSupports: number;
  byType: Record<DemoSupportType, number>;
  topDJs: Array<{
    contactId: number;
    email: string;
    name: string | null;
    count: number;
  }>;
}

/**
 * DemoSupport Repository Interface
 *
 * Defines persistence and analytics operations for demo support entities.
 * Tracks manual DJ support (radio plays, DJ sets, playlists, social shares).
 */
export interface IDemoSupportRepository {
  /**
   * Creates a new demo support record
   *
   * Records that a DJ supported a demo (manual tracking by artist).
   *
   * @param input - Demo support creation data
   * @returns The created demo support entity
   * @throws Error if validation fails or database constraint is violated
   */
  create(input: CreateDemoSupportInput): Promise<DemoSupport>;

  /**
   * Finds a demo support record by ID
   *
   * @param supportId - Demo support UUID
   * @returns DemoSupport entity if found, null otherwise
   */
  findById(supportId: string): Promise<DemoSupport | null>;

  /**
   * Finds all support records for a specific demo
   *
   * Useful for viewing all DJs who supported a specific demo.
   *
   * @param demoId - Demo UUID
   * @returns Array of demo support records for the demo
   */
  findByDemoId(demoId: string): Promise<DemoSupport[]>;

  /**
   * Finds all support records for a specific contact
   *
   * Useful for viewing a DJ's support history across all demos.
   *
   * @param contactId - Contact identifier
   * @returns Array of demo support records by the contact
   */
  findByContactId(contactId: number): Promise<DemoSupport[]>;

  /**
   * Finds all support records for a specific user
   *
   * @param userId - User identifier
   * @returns Array of all demo support records for the user
   */
  findByUserId(userId: number): Promise<DemoSupport[]>;

  /**
   * Updates a demo support record
   *
   * Only updates fields provided in input (partial update).
   * Validates ownership before updating.
   *
   * @param supportId - Demo support UUID
   * @param userId - User identifier (ownership validation)
   * @param input - Fields to update
   * @returns Updated demo support entity
   * @throws Error if support record not found or doesn't belong to user
   */
  update(
    supportId: string,
    userId: number,
    input: UpdateDemoSupportInput
  ): Promise<DemoSupport>;

  /**
   * Deletes a demo support record
   *
   * Validates ownership before deleting.
   *
   * @param supportId - Demo support UUID
   * @param userId - User identifier (ownership validation)
   * @throws Error if support record not found or doesn't belong to user
   */
  delete(supportId: string, userId: number): Promise<void>;

  /**
   * Gets support statistics for a specific demo
   *
   * Calculates total supports, breakdown by type, and top supporting DJs.
   *
   * @param demoId - Demo UUID
   * @returns Statistics for the demo
   */
  getStatsByDemo(demoId: string): Promise<DemoSupportStats>;

  /**
   * Gets support statistics for all demos by a user
   *
   * Aggregates statistics across all user's demos.
   *
   * @param userId - User identifier
   * @returns Aggregated statistics for the user
   */
  getStatsByUser(userId: number): Promise<DemoSupportStats>;

  /**
   * Finds top DJs who supported a user's demos
   *
   * Ranked by number of support records.
   * Useful for identifying most supportive DJs.
   *
   * @param userId - User identifier
   * @param limit - Maximum number of DJs to return
   * @returns Array of top supporting DJs with support counts
   */
  findTopSupportingDJs(
    userId: number,
    limit: number
  ): Promise<
    Array<{
      contactId: number;
      email: string;
      name: string | null;
      count: number;
    }>
  >;
}
