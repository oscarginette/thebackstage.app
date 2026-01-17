/**
 * SoundCloudResultAggregator
 *
 * Utility for collecting and aggregating results from multiple SoundCloud operations.
 * Used to track success/failure of repost, follow, comment, and buy link operations.
 *
 * Domain Layer: Pure business logic utility with no external dependencies.
 */

export interface OperationResult {
  success: boolean;
  error?: string;
}

export interface AggregatedOperationResult {
  repost: OperationResult;
  follow: OperationResult;
  comment: OperationResult & { posted?: boolean };
  buyLink: OperationResult;
}

export class SoundCloudResultAggregator {
  private results: Partial<AggregatedOperationResult> = {};

  recordRepost(result: OperationResult): void {
    this.results.repost = result;
  }

  recordFollow(result: OperationResult): void {
    this.results.follow = result;
  }

  recordComment(result: OperationResult & { posted?: boolean }): void {
    this.results.comment = result;
  }

  recordBuyLink(result: OperationResult): void {
    this.results.buyLink = result;
  }

  getResults(): AggregatedOperationResult {
    return {
      repost: this.results.repost || { success: false, error: 'Not attempted' },
      follow: this.results.follow || { success: false, error: 'Not attempted' },
      comment: this.results.comment || { success: false, error: 'Not attempted' },
      buyLink: this.results.buyLink || { success: false, error: 'Not attempted' },
    };
  }

  hasAnySuccess(): boolean {
    return Object.values(this.results).some(r => r?.success);
  }
}
