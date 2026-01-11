/**
 * IDemoRepository
 *
 * Repository interface for Demo entity following Dependency Inversion Principle.
 * Defines contracts for demo persistence operations with zero implementation details.
 *
 * Clean Architecture: Domain layer defines interface, infrastructure layer implements it.
 */

import type { Demo } from '../entities/Demo';

/**
 * Input for creating a new demo
 */
export interface CreateDemoInput {
  id: string; // UUID
  userId: number;
  title: string;
  artistName: string;
  genre?: string | null;
  bpm?: number | null;
  key?: string | null;
  fileUrl: string;
  artworkUrl?: string | null;
  waveformUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: Date | null;
  notes?: string | null;
  active?: boolean;
}

/**
 * Input for updating an existing demo
 */
export interface UpdateDemoInput {
  title?: string;
  artistName?: string;
  genre?: string | null;
  bpm?: number | null;
  key?: string | null;
  artworkUrl?: string | null;
  waveformUrl?: string | null;
  releaseDate?: Date | null;
  notes?: string | null;
  active?: boolean;
}

/**
 * Demo Repository Interface
 *
 * Defines persistence operations for demo entities.
 * All operations are scoped to a specific user for multi-tenant isolation.
 */
export interface IDemoRepository {
  /**
   * Creates a new demo
   *
   * @param input - Demo creation data
   * @returns The created demo entity
   * @throws Error if validation fails or database constraint is violated
   */
  create(input: CreateDemoInput): Promise<Demo>;

  /**
   * Finds a demo by ID for a specific user
   *
   * @param demoId - Demo UUID
   * @param userId - User identifier (multi-tenant isolation)
   * @returns Demo entity if found and belongs to user, null otherwise
   */
  findById(demoId: string, userId: number): Promise<Demo | null>;

  /**
   * Finds all demos for a specific user
   *
   * @param userId - User identifier
   * @returns Array of all demos (active and inactive)
   */
  findByUserId(userId: number): Promise<Demo[]>;

  /**
   * Finds only active demos for a specific user
   *
   * @param userId - User identifier
   * @returns Array of active demos (active = true)
   */
  findActiveByUserId(userId: number): Promise<Demo[]>;

  /**
   * Updates a demo
   *
   * Only updates fields provided in input (partial update).
   * Validates ownership before updating.
   *
   * @param demoId - Demo UUID
   * @param userId - User identifier (ownership validation)
   * @param input - Fields to update
   * @returns Updated demo entity
   * @throws Error if demo not found or doesn't belong to user
   */
  update(demoId: string, userId: number, input: UpdateDemoInput): Promise<Demo>;

  /**
   * Deletes a demo
   *
   * Cascades to demo_sends and demo_supports (database constraint).
   * Validates ownership before deleting.
   *
   * @param demoId - Demo UUID
   * @param userId - User identifier (ownership validation)
   * @throws Error if demo not found or doesn't belong to user
   */
  delete(demoId: string, userId: number): Promise<void>;

  /**
   * Counts total demos for a user
   *
   * Used for quota checks and analytics.
   *
   * @param userId - User identifier
   * @returns Total number of demos (active + inactive)
   */
  countByUserId(userId: number): Promise<number>;

  /**
   * Finds demos by genre for a specific user
   *
   * Useful for filtering demos when sending to DJs with specific genre preferences.
   *
   * @param userId - User identifier
   * @param genre - Genre to filter by (case-insensitive)
   * @returns Array of demos matching the genre
   */
  findByGenre(userId: number, genre: string): Promise<Demo[]>;
}
