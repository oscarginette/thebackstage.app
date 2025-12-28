import { NextResponse } from 'next/server';
import { SendCustomEmailUseCase, ValidationError } from '@/domain/services/SendCustomEmailUseCase';
import { CheckEmailQuotaUseCase } from '@/domain/services/CheckEmailQuotaUseCase';
import {
  contactRepository,
  emailLogRepository,
  executionLogRepository,
  emailCampaignRepository
} from '@/infrastructure/database/repositories';
import { resendEmailProvider } from '@/infrastructure/email';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { auth } from '@/lib/auth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/send-custom-email
 * Send a custom email to all subscribed contacts or save as draft
 *
 * Body:
 * - subject: string (required) - Email subject
 * - greeting: string (required) - Email greeting (e.g., "Hey mate,")
 * - message: string (required) - Main email message (supports markdown)
 * - signature: string (required) - Email signature (e.g., "Much love,\nGee Beat")
 * - coverImage: string (optional) - URL to cover image
 * - saveAsDraft: boolean (optional, default: false) - Save as draft instead of sending
 * - templateId: string (optional) - ID of template used (if based on template)
 * - scheduledAt: string (optional) - ISO date string for scheduled sending
 *
 * Response (when sending):
 * {
 *   success: true,
 *   campaignId: string,
 *   emailsSent: number,
 *   emailsFailed: number,
 *   totalContacts: number,
 *   duration: number,
 *   failures?: Array<{ email: string, error: string }>
 * }
 *
 * Response (when saving as draft):
 * {
 *   success: true,
 *   campaignId: string,
 *   duration: number
 * }
 */
export async function POST(request: Request) {
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

    const body = await request.json();

    // Skip quota check if saving as draft
    if (!body.saveAsDraft) {
      // Check email quota BEFORE sending
      const userRepository = new PostgresUserRepository();
      const checkEmailQuotaUseCase = new CheckEmailQuotaUseCase(userRepository);

      // Get contact count to estimate emails to be sent
      const subscribedContacts = await contactRepository.getSubscribed(userId);
      const emailCount = subscribedContacts.length;

      const quotaCheck = await checkEmailQuotaUseCase.execute({
        userId,
        emailCount,
      });

      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: quotaCheck.message || 'Email quota exceeded',
            upgradeRequired: true,
            quota: {
              current: quotaCheck.currentCount,
              limit: quotaCheck.limit,
              remaining: quotaCheck.remaining,
              wouldExceedBy: quotaCheck.wouldExceedBy,
              attempting: emailCount,
            },
          },
          { status: 403 }
        );
      }
    }

    const useCase = new SendCustomEmailUseCase(
      contactRepository,
      resendEmailProvider,
      emailLogRepository,
      executionLogRepository,
      emailCampaignRepository
    );

    const result = await useCase.execute({
      userId,
      subject: body.subject,
      greeting: body.greeting,
      message: body.message,
      signature: body.signature,
      coverImage: body.coverImage,
      saveAsDraft: body.saveAsDraft || false,
      templateId: body.templateId,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending custom email:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
