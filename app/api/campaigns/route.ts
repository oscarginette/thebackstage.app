import { GetCampaignsUseCase } from '@/domain/services/campaigns/GetCampaignsUseCase';
import { CreateCampaignUseCase } from '@/domain/services/campaigns/CreateCampaignUseCase';
import { emailCampaignRepository } from '@/infrastructure/database/repositories';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, createdResponse } from '@/lib/api-response';
import { CreateCampaignSchema, GetCampaignsQuerySchema } from '@/lib/validation-schemas';
import { auth } from '@/lib/auth';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * List all email campaigns for the authenticated user
 *
 * Security:
 * - Requires authentication
 * - Multi-tenant: Only returns campaigns belonging to the authenticated user
 *
 * Query parameters:
 * - status: 'draft' | 'sent' (optional) - Filter by campaign status
 * - trackId: string (optional) - Filter by track ID
 * - templateId: string (optional) - Filter by template ID
 * - scheduledOnly: boolean (optional) - Only return scheduled campaigns
 */
export const GET = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }

  const userId = parseInt(session.user.id);

  // 2. Extract and validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    status: searchParams.get('status'),
    trackId: searchParams.get('trackId'),
    templateId: searchParams.get('templateId'),
    scheduledOnly: searchParams.get('scheduledOnly'),
  };

  // Validate query parameters
  const validation = GetCampaignsQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    throw new ValidationError('Invalid query parameters', validation.error.format());
  }

  const validatedParams = validation.data;
  const status = validatedParams.status as 'draft' | 'sent' | undefined;
  const trackId = validatedParams.trackId;
  const templateId = validatedParams.templateId;
  const scheduledOnly = validatedParams.scheduledOnly === 'true';

  // 3. Execute use case with user isolation
  const useCase = new GetCampaignsUseCase(emailCampaignRepository);
  const result = await useCase.execute({
    userId,
    options: {
      status: status || undefined,
      trackId: trackId || undefined,
      templateId: templateId || undefined,
      scheduledOnly
    }
  });

  return successResponse(
    {
      campaigns: result.campaigns,
      count: result.count
    },
    200,
    requestId
  );
});

/**
 * POST /api/campaigns
 * Create a new email campaign or draft for the authenticated user
 *
 * Security:
 * - Requires authentication
 * - Multi-tenant: Campaign is automatically associated with authenticated user
 *
 * Body:
 * - templateId: string (optional) - Template to base campaign on
 * - trackId: string (optional) - Track to link campaign to
 * - subject: string (required) - Campaign subject
 * - htmlContent: string (required) - Campaign HTML content
 * - status: 'draft' | 'sent' (optional, default: 'draft') - Initial status
 * - scheduledAt: string (optional) - ISO date string for scheduled sending
 */
export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }

  const userId = parseInt(session.user.id);

  // 2. Parse and validate request body
  const body = await request.json();
  const validation = CreateCampaignSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.format());
  }

  const validatedData = validation.data;

  // 3. Execute use case with user isolation
  const useCase = new CreateCampaignUseCase(emailCampaignRepository);
  const result = await useCase.execute({
    userId,
    templateId: validatedData.templateId,
    trackId: validatedData.trackId,
    subject: validatedData.subject,
    greeting: validatedData.greeting,
    message: validatedData.message,
    signature: validatedData.signature,
    htmlContent: validatedData.htmlContent,
    status: validatedData.status,
    scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null
  });

  return createdResponse(
    {
      campaign: result.campaign,
      success: result.success
    },
    requestId
  );
});
