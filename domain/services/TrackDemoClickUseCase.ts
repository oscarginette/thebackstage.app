/**
 * TrackDemoClickUseCase
 *
 * Tracks when a DJ clicks demo link (webhook handler).
 *
 * Responsibilities:
 * - Find demo send by ID
 * - Mark send as clicked (idempotent)
 * - Update status and timestamp
 * - Auto-mark as opened if not already
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles click tracking logic).
 * Dependency Inversion: Depends on IDemoSendRepository interface.
 *
 * Idempotency:
 * - Multiple click events for the same send are safe
 * - Only first click updates the timestamp
 * - Prevents duplicate clicks from inflating analytics
 *
 * Auto-Open Detection:
 * - Clicking implies opening (can't click without opening email)
 * - If openedAt is null, sets it to clickedAt timestamp
 * - Ensures analytics are accurate (every click counts as open)
 */

import type { IDemoSendRepository } from '../repositories/IDemoSendRepository';
import type { DemoSend } from '../entities/DemoSend';
import { ValidationError } from '@/lib/errors';

/**
 * Input for tracking demo click
 */
export interface TrackDemoClickInput {
  sendId: string;
  clickedAt: Date;
}

/**
 * Result of tracking demo click
 */
export interface TrackDemoClickResult {
  success: boolean;
  send?: DemoSend;
  error?: string;
}

/**
 * TrackDemoClickUseCase
 *
 * Handles tracking of demo link clicks with idempotent updates.
 * Used by webhook handlers to process link tracking events.
 */
export class TrackDemoClickUseCase {
  constructor(private readonly demoSendRepository: IDemoSendRepository) {}

  /**
   * Executes demo click tracking
   *
   * @param input - Click tracking data
   * @returns Result with updated demo send or error message
   */
  async execute(input: TrackDemoClickInput): Promise<TrackDemoClickResult> {
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

      // 3. Mark as clicked (idempotent - no-op if already clicked)
      // Also marks as opened if not already opened
      const updatedSend = await this.demoSendRepository.markAsClicked(
        input.sendId,
        input.clickedAt
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
        error: 'Failed to track demo click',
      };
    }
  }

  /**
   * Validates track demo click input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: TrackDemoClickInput): void {
    if (!input.sendId || input.sendId.trim().length === 0) {
      throw new ValidationError('Send ID cannot be empty');
    }

    if (!input.clickedAt) {
      throw new ValidationError('Clicked timestamp is required');
    }

    // Validate timestamp is not in the future
    const now = new Date();
    if (input.clickedAt > now) {
      throw new ValidationError('Clicked timestamp cannot be in the future');
    }
  }
}
