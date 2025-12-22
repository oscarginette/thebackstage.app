/**
 * GetDownloadGateUseCase
 *
 * Retrieves a download gate by ID or slug.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - For authenticated requests: Check user owns gate
 * - For public requests: Only return active, non-expired gates
 * - Return null if gate not found or access denied
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (gate retrieval)
 * - DIP: Depends on IDownloadGateRepository interface
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { DownloadGate } from '../entities/DownloadGate';

export interface GetDownloadGateByIdInput {
  userId: number;
  gateId: string;
}

export interface GetDownloadGateBySlugInput {
  slug: string;
}

export class GetDownloadGateUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Get gate by ID (authenticated)
   * Verifies user owns the gate
   * @param input - User ID and gate ID
   * @returns Gate or null if not found or access denied
   */
  async executeById(input: GetDownloadGateByIdInput): Promise<DownloadGate | null> {
    try {
      const gate = await this.gateRepository.findById(input.userId, input.gateId);

      if (!gate) {
        return null;
      }

      // Verify user owns the gate
      if (gate.userId !== input.userId) {
        console.warn(
          `Access denied: User ${input.userId} attempted to access gate ${input.gateId} owned by user ${gate.userId}`
        );
        return null;
      }

      return gate;
    } catch (error) {
      console.error('GetDownloadGateUseCase.executeById error:', error);
      return null;
    }
  }

  /**
   * Get gate by slug (public)
   * Only returns active, non-expired gates
   * @param input - Gate slug
   * @returns Gate or null if not found or inactive
   */
  async executeBySlug(input: GetDownloadGateBySlugInput): Promise<DownloadGate | null> {
    try {
      if (!input.slug || input.slug.trim().length === 0) {
        return null;
      }

      const gate = await this.gateRepository.findBySlug(input.slug);

      if (!gate) {
        return null;
      }

      // Only return active gates for public access
      if (!gate.isActive()) {
        return null;
      }

      return gate;
    } catch (error) {
      console.error('GetDownloadGateUseCase.executeBySlug error:', error);
      return null;
    }
  }
}
