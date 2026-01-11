/**
 * TrackDemoOpenUseCase
 *
 * Tracks when a DJ opens a demo email (webhook handler).
 *
 * Responsibilities:
 * - Find demo send by ID
 * - Mark send as opened (idempotent)
 * - Update status and timestamp
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles open tracking logic).
 * Dependency Inversion: Depends on IDemoSendRepository interface.
 *
 * Idempotency:
 * - Multiple open events for the same send are safe
 * - Only first open updates the timestamp
 * - Prevents duplicate opens from inflating analytics
 */

import type { IDemoSendRepository } from '../repositories/IDemoSendRepository';
import type { DemoSend } from '../entities/DemoSend';
import { ValidationError } from '@/lib/errors';

/**
 * Input for tracking demo open
 */
export interface TrackDemoOpenInput {
  sendId: string;
  openedAt: Date;
}

/**
 * Result of tracking demo open
 */
export interface TrackDemoOpenResult {
  success: boolean;
  send?: DemoSend;
  error?: string;
}

/**
 * TrackDemoOpenUseCase
 *
 * Handles tracking of demo email opens with idempotent updates.
 * Used by webhook handlers to process email tracking events.
 */
export class TrackDemoOpenUseCase {
  constructor(private readonly demoSendRepository: IDemoSendRepository) {}

  /**
   * Executes demo open tracking
   *
   * @param input - Open tracking data
   * @returns Result with updated demo send or error message
   */
  async execute(input: TrackDemoOpenInput): Promise<TrackDemoOpenResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Find demo send by ID
      const send = await this.demoSendRepository.findById(input.sendId);

      if (!send) {
        return {
          success: false,
          error: 'Demo send not found',
        };
      }

      // 3. Mark as opened (idempotent - no-op if already opened)
      const updatedSend = await this.demoSendRepository.markAsOpened(
        input.sendId,
        input.openedAt
      );

      // 4. Return success result
      return {
        success: true,
        send: updatedSend,
      };
    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Unexpected error
      return {
        success: false,
        error: 'Failed to track demo open',
      };
    }
  }

  /**
   * Validates track demo open input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: TrackDemoOpenInput): void {
    if (!input.sendId || input.sendId.trim().length === 0) {
      throw new ValidationError('Send ID cannot be empty');
    }

    if (!input.openedAt) {
      throw new ValidationError('Opened timestamp is required');
    }

    // Validate timestamp is not in the future
    const now = new Date();
    if (input.openedAt > now) {
      throw new ValidationError('Opened timestamp cannot be in the future');
    }
  }
}
