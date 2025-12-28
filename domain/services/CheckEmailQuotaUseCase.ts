/**
 * CheckEmailQuotaUseCase
 *
 * Checks if user can send more emails based on subscription quota.
 * Cost-critical metric: max_monthly_emails (from subscription plan).
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (only checks email quota), Dependency Inversion.
 */

import { IUserRepository } from '../repositories/IUserRepository';

export interface CheckEmailQuotaInput {
  userId: number;
  emailCount?: number; // Default: 1 (for single email)
}

export interface CheckEmailQuotaResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  wouldExceedBy: number;
  upgradeRequired: boolean;
  message?: string;
}

export class EmailQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailQuotaExceededError';
  }
}

export class CheckEmailQuotaUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CheckEmailQuotaInput): Promise<CheckEmailQuotaResult> {
    // Validate input
    if (!input.userId || input.userId <= 0) {
      throw new Error('Invalid userId');
    }

    const emailCount = input.emailCount || 1;

    if (emailCount < 0) {
      throw new Error('emailCount must be non-negative');
    }

    // Get user quota information
    const quotaInfo = await this.userRepository.getQuotaInfo(input.userId);

    const currentCount = quotaInfo.emailsSentThisMonth;
    const limit = quotaInfo.maxMonthlyEmails;

    // Check for unlimited plan (maxMonthlyEmails = null or very high number)
    const isUnlimited = limit >= 999999999;

    if (isUnlimited) {
      return {
        allowed: true,
        currentCount,
        limit,
        remaining: 999999999,
        wouldExceedBy: 0,
        upgradeRequired: false,
      };
    }

    const remaining = Math.max(0, limit - currentCount);
    const wouldExceed = currentCount + emailCount > limit;
    const wouldExceedBy = wouldExceed ? currentCount + emailCount - limit : 0;

    let message: string | undefined;

    if (wouldExceed) {
      message = `Email quota exceeded (${currentCount}/${limit}). You would exceed by ${wouldExceedBy} emails. Please upgrade your plan or wait for next billing cycle.`;
    }

    return {
      allowed: !wouldExceed,
      currentCount,
      limit,
      remaining,
      wouldExceedBy,
      upgradeRequired: wouldExceed,
      message,
    };
  }
}
