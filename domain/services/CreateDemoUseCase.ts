/**
 * CreateDemoUseCase
 *
 * Creates a new demo (unreleased track) for DJ distribution.
 *
 * Responsibilities:
 * - Generate unique UUID for demo
 * - Validate all demo fields using Demo entity
 * - Persist demo to database
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles demo creation logic).
 * Dependency Inversion: Depends on IDemoRepository interface, not concrete implementation.
 */

import { randomUUID } from 'crypto';
import { Demo } from '../entities/Demo';
import type { IDemoRepository } from '../repositories/IDemoRepository';
import { ValidationError } from '@/lib/errors';

/**
 * Input for creating a new demo
 */
export interface CreateDemoInput {
  userId: number;
  title: string;
  artistName: string;
  genre?: string;
  bpm?: number;
  key?: string;
  fileUrl: string;
  artworkUrl?: string;
  waveformUrl?: string;
  durationSeconds?: number;
  releaseDate?: Date;
  notes?: string;
}

/**
 * Result of demo creation
 */
export interface CreateDemoResult {
  success: boolean;
  demo?: Demo;
  error?: string;
}

/**
 * CreateDemoUseCase
 *
 * Handles creation of new demos with comprehensive validation.
 * Uses Demo entity factory method for domain validation.
 */
export class CreateDemoUseCase {
  constructor(private readonly demoRepository: IDemoRepository) {}

  /**
   * Executes demo creation
   *
   * @param input - Demo creation data
   * @returns Result with created demo or error message
   */
  async execute(input: CreateDemoInput): Promise<CreateDemoResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Generate unique UUID for demo
      const demoId = randomUUID();

      // 3. Use Demo entity factory to create and validate
      // This throws if validation fails (title empty, invalid BPM, etc)
      const demo = Demo.create({
        id: demoId,
        userId: input.userId.toString(),
        title: input.title,
        artistName: input.artistName,
        genre: input.genre,
        bpm: input.bpm,
        key: input.key,
        fileUrl: input.fileUrl,
        artworkUrl: input.artworkUrl,
        waveformUrl: input.waveformUrl,
        durationSeconds: input.durationSeconds,
        releaseDate: input.releaseDate,
        notes: input.notes,
        active: true,
      });

      // 4. Persist to database
      const createdDemo = await this.demoRepository.create({
        id: demo.id,
        userId: input.userId,
        title: demo.title,
        artistName: demo.artistName,
        genre: demo.genre,
        bpm: demo.bpm,
        key: demo.key,
        fileUrl: demo.fileUrl,
        artworkUrl: demo.artworkUrl,
        waveformUrl: demo.waveformUrl,
        durationSeconds: demo.durationSeconds,
        releaseDate: demo.releaseDate,
        notes: demo.notes,
        active: demo.active,
      });

      // 5. Return success result
      return {
        success: true,
        demo: createdDemo,
      };
    } catch (error) {
      // Handle validation errors from Demo entity
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Unexpected error
      return {
        success: false,
        error: 'Failed to create demo',
      };
    }
  }

  /**
   * Validates create demo input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: CreateDemoInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Title cannot be empty');
    }

    if (!input.artistName || input.artistName.trim().length === 0) {
      throw new ValidationError('Artist name cannot be empty');
    }

    if (!input.fileUrl || input.fileUrl.trim().length === 0) {
      throw new ValidationError('File URL cannot be empty');
    }

    // Additional domain validation happens in Demo.create()
  }
}
