/**
 * GetGateStatsUseCase
 *
 * Retrieves aggregated statistics for a download gate.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify user owns gate
 * - Aggregate stats from analytics table
 * - Calculate conversion rates
 * - Return comprehensive stats
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (stats retrieval)
 * - DIP: Depends on repository interfaces
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { GateStats } from '../types/download-gates';

export interface GetGateStatsInput {
  userId: number;
  gateId: string;
}

export interface GetGateStatsResult {
  success: boolean;
  stats?: GateStats;
  error?: string;
}

export class GetGateStatsUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository
  ) {}

  /**
   * Execute stats retrieval
   * @param input - User ID and gate ID
   * @returns GetGateStatsResult with stats or error
   */
  async execute(input: GetGateStatsInput): Promise<GetGateStatsResult> {
    try {
      // 1. Verify gate exists and user owns it
      const gate = await this.gateRepository.findById(input.userId, input.gateId);
      if (!gate) {
        return {
          success: false,
          error: 'Gate not found or access denied',
        };
      }

      // 2. Get aggregated stats from analytics
      const stats = await this.analyticsRepository.getGateStats(input.gateId);

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('GetGateStatsUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve gate stats',
      };
    }
  }

  /**
   * Calculate conversion rate
   * @param conversions - Number of conversions
   * @param total - Total events
   * @returns Conversion rate as percentage (0-100)
   */
  static calculateConversionRate(conversions: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((conversions / total) * 100 * 100) / 100; // Round to 2 decimals
  }
}
