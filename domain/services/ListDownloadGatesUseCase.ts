/**
 * ListDownloadGatesUseCase
 *
 * Retrieves all download gates for a user.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Return all gates for user (including inactive)
 * - Include basic stats (views, downloads, conversion)
 * - Sort by creation date (newest first)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (list gates)
 * - DIP: Depends on repository interfaces
 */

import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { DownloadGate } from '../entities/DownloadGate';

export interface GateWithStats {
  gate: DownloadGate;
  stats: {
    totalViews: number;
    totalSubmissions: number;
    totalDownloads: number;
    conversionRate: number;
    soundcloudReposts: number;
    soundcloudFollows: number;
    spotifyConnects: number;
  };
}

export class ListDownloadGatesUseCase {
  constructor(
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository
  ) {}

  /**
   * List all gates for a user with basic statistics
   * @param userId - User ID
   * @returns Array of gates with stats
   */
  async execute(userId: number): Promise<GateWithStats[]> {
    try {
      // 1. Get all gates for user
      const gates = await this.gateRepository.findAllByUser(userId);

      // 2. Get stats for each gate
      const gatesWithStats = await Promise.all(
        gates.map(async (gate) => {
          const stats = await this.getBasicStats(gate.id);
          return {
            gate,
            stats,
          };
        })
      );

      return gatesWithStats;
    } catch (error) {
      console.error('ListDownloadGatesUseCase.execute error:', error);
      return [];
    }
  }

  /**
   * Get basic statistics for a gate
   * @param gateId - Gate UUID
   * @returns Basic stats
   */
  private async getBasicStats(gateId: string): Promise<{
    totalViews: number;
    totalSubmissions: number;
    totalDownloads: number;
    conversionRate: number;
    soundcloudReposts: number;
    soundcloudFollows: number;
    spotifyConnects: number;
  }> {
    try {
      const stats = await this.analyticsRepository.getGateStats(gateId);

      return {
        totalViews: stats.totalViews,
        totalSubmissions: stats.totalSubmissions,
        totalDownloads: stats.totalDownloads,
        conversionRate: stats.conversionRate,
        soundcloudReposts: stats.soundcloudReposts,
        soundcloudFollows: stats.soundcloudFollows,
        spotifyConnects: stats.spotifyConnects,
      };
    } catch (error) {
      console.error(`Failed to get stats for gate ${gateId}:`, error);
      // Return zero stats if analytics fetch fails
      return {
        totalViews: 0,
        totalSubmissions: 0,
        totalDownloads: 0,
        conversionRate: 0,
        soundcloudReposts: 0,
        soundcloudFollows: 0,
        spotifyConnects: 0,
      };
    }
  }
}
