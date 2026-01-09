import { NextResponse } from 'next/server';
import { ValidationError } from '@/domain/services/SendCustomEmailUseCase';
import { UseCaseFactory, RepositoryFactory } from '@/lib/di-container';
import { auth } from '@/lib/auth';
import { SendCustomEmailSchema } from '@/lib/validation-schemas';
import { ListFilterCriteria } from '@/domain/value-objects/ListFilterCriteria';

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

    // Validate request body
    const validation = SendCustomEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Parse list filter (if provided)
    let listFilter: ListFilterCriteria | undefined;
    if (body.listFilter) {
      try {
        listFilter = new ListFilterCriteria(
          body.listFilter.mode,
          body.listFilter.listIds || []
        );
      } catch (error: any) {
        return NextResponse.json(
          { error: `Invalid list filter: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Skip quota check if saving as draft
    if (!validatedData.saveAsDraft) {
      // Check email quota BEFORE sending
      const contactRepository = RepositoryFactory.createContactRepository();
      const checkEmailQuotaUseCase = UseCaseFactory.createCheckEmailQuotaUseCase();

      // Get contact count to estimate emails to be sent (with list filtering)
      const filterCriteria = listFilter || ListFilterCriteria.allContacts();
      const subscribedContacts = await contactRepository.getSubscribedByListFilter(
        userId,
        filterCriteria
      );
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

    // Initialize use case via DI container
    const useCase = UseCaseFactory.createSendCustomEmailUseCase();

    const result = await useCase.execute({
      userId,
      subject: validatedData.subject,
      greeting: validatedData.greeting,
      message: validatedData.message,
      signature: validatedData.signature,
      coverImage: validatedData.coverImage,
      saveAsDraft: validatedData.saveAsDraft,
      templateId: validatedData.templateId,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      listFilter
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Failed to send custom email';
    console.error('Error sending custom email:', errorMessage);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
