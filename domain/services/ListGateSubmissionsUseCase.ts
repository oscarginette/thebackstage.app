/**
 * ListGateSubmissionsUseCase
 *
 * Retrieves all submissions for a download gate.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify user owns the gate
 * - Return all submissions ordered by creation date (newest first)
 * - Include verification status for each submission
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (list submissions)
 * - DIP: Depends on repository interfaces
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { DownloadSubmission } from '../entities/DownloadSubmission';

export interface ListGateSubmissionsInput {
  userId: number;
  gateId: string;
}

export interface ListGateSubmissionsResult {
  success: boolean;
  submissions?: DownloadSubmission[];
  error?: string;
}

export class ListGateSubmissionsUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly submissionRepository: IDownloadSubmissionRepository
  ) {}

  /**
   * Execute submissions list retrieval
   * @param input - User ID and gate ID
   * @returns ListGateSubmissionsResult with submissions or error
   */
  async execute(input: ListGateSubmissionsInput): Promise<ListGateSubmissionsResult> {
    try {
      // 1. Verify gate exists and user owns it
      const gate = await this.gateRepository.findById(input.userId, input.gateId);
      if (!gate) {
        return {
          success: false,
          error: 'Gate not found or access denied',
        };
      }

      // 2. Get all submissions for the gate
      const submissions = await this.submissionRepository.findAllByGate(input.gateId);

      return {
        success: true,
        submissions,
      };
    } catch (error) {
      console.error('ListGateSubmissionsUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve submissions',
      };
    }
  }
}
