/**
 * GetDemoAnalyticsUseCase
 *
 * Gets comprehensive analytics for a demo.
 *
 * Responsibilities:
 * - Validate demo exists and belongs to user
 * - Aggregate send statistics (total, opened, clicked, rates)
 * - Aggregate support statistics (total, by type, top supporters)
 * - Get recent sends (last 10)
 * - Get top supporting DJs (limit 10)
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles analytics aggregation logic).
 * Dependency Inversion: Depends on interfaces, not concrete implementations.
 *
 * Analytics Composition:
 * - Send Stats: Email engagement metrics (open rate, click rate)
 * - Support Stats: DJ support breakdown by type
 * - Recent Activity: Last 10 demo sends
 * - Top Supporters: Most supportive DJs
 */

import type { IDemoRepository } from '../repositories/IDemoRepository';
import type { IDemoSendRepository, DemoSendStats } from '../repositories/IDemoSendRepository';
import type { IDemoSupportRepository, DemoSupportStats } from '../repositories/IDemoSupportRepository';
import type { Demo } from '../entities/Demo';
import type { DemoSend } from '../entities/DemoSend';
import { ValidationError } from '@/lib/errors';

/**
 * Input for getting demo analytics
 */
export interface GetDemoAnalyticsInput {
  demoId: string;
  userId: number;
}

/**
 * Comprehensive demo analytics
 */
export interface DemoAnalytics {
  demo: Demo;
  sendStats: DemoSendStats;
  supportStats: DemoSupportStats;
  recentSends: DemoSend[];
  topSupporters: Array<{
    contactId: number;
    email: string;
    name: string | null;
    count: number;
  }>;
}

/**
 * Result of getting demo analytics
 */
export interface GetDemoAnalyticsResult {
  success: boolean;
  analytics?: DemoAnalytics;
  error?: string;
}

/**
 * GetDemoAnalyticsUseCase
 *
 * Handles aggregation of demo analytics from multiple data sources.
 * Provides comprehensive view of demo performance and DJ engagement.
 */
export class GetDemoAnalyticsUseCase {
  constructor(
    private readonly demoRepository: IDemoRepository,
    private readonly demoSendRepository: IDemoSendRepository,
    private readonly demoSupportRepository: IDemoSupportRepository
  ) {}

  /**
   * Executes demo analytics retrieval
   *
   * @param input - Analytics request data
   * @returns Result with aggregated analytics or error message
   */
  async execute(input: GetDemoAnalyticsInput): Promise<GetDemoAnalyticsResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Validate demo exists and belongs to user
      const demo = await this.demoRepository.findById(input.demoId, input.userId);

      if (!demo) {
        return {
          success: false,
          error: 'Demo not found or access denied',
        };
      }

      // 3. Get send statistics
      const sendStats = await this.demoSendRepository.getStatsByDemo(input.demoId);

      // 4. Get support statistics
      const supportStats = await this.demoSupportRepository.getStatsByDemo(input.demoId);

      // 5. Get recent sends (last 10)
      const allSends = await this.demoSendRepository.findByDemoId(input.demoId);
      const recentSends = allSends
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
        .slice(0, 10);

      // 6. Get top supporting DJs (limit 10)
      // Extract from supportStats.topDJs
      const topSupporters = supportStats.topDJs.slice(0, 10);

      // 7. Aggregate all analytics
      const analytics: DemoAnalytics = {
        demo,
        sendStats,
        supportStats,
        recentSends,
        topSupporters,
      };

      // 8. Return success result
      return {
        success: true,
        analytics,
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
        error: 'Failed to get demo analytics',
      };
    }
  }

  /**
   * Validates get demo analytics input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: GetDemoAnalyticsInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.demoId || input.demoId.trim().length === 0) {
      throw new ValidationError('Demo ID cannot be empty');
    }
  }
}
