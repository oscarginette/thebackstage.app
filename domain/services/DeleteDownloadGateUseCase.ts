/**
 * DeleteDownloadGateUseCase
 *
 * Deletes a download gate and cascades to related data.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify user owns gate before deletion
 * - Cascade delete submissions + analytics (handled by DB constraints)
 * - Permanent deletion (no soft delete for now)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (gate deletion)
 * - DIP: Depends on IDownloadGateRepository interface
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';

export interface DeleteDownloadGateResult {
  success: boolean;
  error?: string;
}

export class DeleteDownloadGateUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Execute gate deletion
   * @param userId - User deleting the gate
   * @param gateId - Gate ID to delete
   * @returns DeleteDownloadGateResult with success status
   */
  async execute(userId: number, gateId: string): Promise<DeleteDownloadGateResult> {
    try {
      // 1. Verify gate exists and user owns it
      const gate = await this.gateRepository.findById(userId, gateId);
      if (!gate) {
        return {
          success: false,
          error: 'Gate not found or access denied',
        };
      }

      // 2. Delete gate (cascade deletes submissions + analytics via DB)
      await this.gateRepository.delete(userId, gateId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('DeleteDownloadGateUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete download gate',
      };
    }
  }
}
