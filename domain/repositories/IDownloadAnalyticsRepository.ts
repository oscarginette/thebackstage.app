/**
 * IDownloadAnalyticsRepository Interface
 *
 * Defines the contract for download analytics data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation (PostgreSQL)
 *
 * Analytics track user behavior across download gates for
 * performance monitoring and optimization.
 */

import {
  CreateAnalyticsInput,
  AnalyticsEvent,
  GateStats,
} from '../types/download-gates';

/**
 * Repository interface for DownloadAnalytics
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IDownloadAnalyticsRepository {
  /**
   * Track an analytics event
   * Events: view, submit, download, oauth_start, oauth_complete
   * @param input - Analytics event data
   * @returns Event ID (UUID) for deduplication in pixel tracking
   */
  track(input: CreateAnalyticsInput): Promise<string>;

  /**
   * Get aggregated statistics for a gate
   * Includes: views, submissions, downloads, conversion rates
   * @param gateId - Gate UUID
   * @returns Gate statistics
   */
  getGateStats(gateId: string): Promise<GateStats>;

  /**
   * Get detailed analytics events for a gate
   * Used for detailed performance analysis
   * @param gateId - Gate UUID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Array of analytics events
   */
  getGateAnalytics(
    gateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]>;

  /**
   * Get conversion funnel data
   * Shows drop-off at each step: view -> submit -> download
   * @param gateId - Gate UUID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Funnel statistics
   */
  getConversionFunnel(
    gateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    views: number;
    submissions: number;
    downloads: number;
    viewToSubmit: number; // Percentage
    submitToDownload: number; // Percentage
    viewToDownload: number; // Percentage
  }>;

  /**
   * Get traffic sources for a gate
   * Groups by referrer, UTM parameters
   * @param gateId - Gate UUID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Traffic source breakdown
   */
  getTrafficSources(
    gateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      referrer: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      count: number;
    }>
  >;

  /**
   * Get geographic distribution of views/downloads
   * Groups by country code
   * @param gateId - Gate UUID
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Geographic breakdown
   */
  getGeographicDistribution(
    gateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      country: string | null;
      views: number;
      downloads: number;
    }>
  >;
}
