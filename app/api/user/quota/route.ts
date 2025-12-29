/**
 * User Quota API Route
 *
 * Authenticated endpoint to fetch current user's quota usage and limits.
 * Returns subscription plan details and quota information.
 *
 * Clean Architecture: API route orchestrates, data from repository.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';

export const dynamic = 'force-dynamic';

const userRepository = new PostgresUserRepository();
const contactRepository = new PostgresContactRepository();

/**
 * GET /api/user/quota
 *
 * Get current user's quota usage and limits
 *
 * Response:
 * {
 *   currentContacts: number,
 *   maxContacts: number,
 *   currentEmails: number,
 *   maxEmails: number,
 *   subscriptionPlan: string,
 *   subscriptionExpiresAt: Date | null,
 *   quotaUsagePercent: {
 *     contacts: number,
 *     emails: number
 *   }
 * }
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get quota information from user repository
    const quotaInfo = await userRepository.getQuotaInfo(userId);

    // Get current contact count
    const currentContacts = await contactRepository.countByUserId(userId);

    // Calculate usage percentages
    const contactsPercent = Math.round(
      (currentContacts / quotaInfo.maxContacts) * 100
    );

    const emailsPercent =
      quotaInfo.maxMonthlyEmails >= 999999999
        ? 0 // Unlimited plan
        : Math.round(
            (quotaInfo.emailsSentThisMonth / quotaInfo.maxMonthlyEmails) * 100
          );

    return NextResponse.json({
      currentContacts,
      maxContacts: quotaInfo.maxContacts,
      currentEmails: quotaInfo.emailsSentThisMonth,
      maxEmails: quotaInfo.maxMonthlyEmails,
      subscriptionPlan: quotaInfo.subscriptionPlan,
      subscriptionExpiresAt: quotaInfo.subscriptionExpiresAt,
      quotaUsagePercent: {
        contacts: contactsPercent,
        emails: emailsPercent,
      },
    });
  } catch (error: unknown) {
    console.error('User quota API error:', error);

    if (error instanceof Error ? error.message : "Unknown error"?.includes('not found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
