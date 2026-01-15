/**
 * POST /api/campaigns/[id]/resend
 *
 * Duplicates a historical campaign as a new draft.
 *
 * Clean Architecture + SOLID:
 * - API route only orchestrates (no business logic)
 * - Business logic in ResendCampaignUseCase (domain layer)
 * - Depends on abstractions via DI container
 *
 * Security:
 * - Requires authentication
 * - Verifies campaign ownership (multi-tenant)
 * - Only allows resending sent campaigns (not drafts)
 */

import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/resend
 *
 * Duplicates a historical campaign as a new draft for resending.
 *
 * Requirements:
 * - User must be authenticated
 * - Campaign must exist and belong to user
 * - Campaign status must be 'sent' (not draft)
 *
 * Response:
 * - success: boolean
 * - newDraftId: string (UUID of newly created draft)
 * - originalCampaign: object (original campaign data for reference)
 *
 * Errors:
 * - 401: Not authenticated
 * - 404: Campaign not found
 * - 400: Campaign not sent yet (cannot resend drafts)
 * - 403: Unauthorized (not campaign owner)
 * - 500: Server error
 */
async function handlePost(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }

  const { id: campaignId } = await context!.params;
  const requestId = generateRequestId();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔄 API REQUEST: POST /api/campaigns/[id]/resend');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Request ID:', requestId);
  console.log('Session User ID:', session.user.id);
  console.log('Campaign ID:', campaignId);
  console.log('');

  const userIdNumber = parseInt(session.user.id);

  // Instantiate use case via DI container (SOLID: Dependency Inversion)
  const resendCampaignUseCase = UseCaseFactory.createResendCampaignUseCase();

  // Execute business logic (all logic delegated to use case)
  console.log('📞 Calling ResendCampaignUseCase.execute()...');
  console.log('');

  const result = await resendCampaignUseCase.execute({
    userId: userIdNumber,
    campaignId: campaignId
  });

  // Handle business logic errors (use case returns error in result)
  if (!result.success) {
    console.log('');
    console.log('❌ Use Case returned error:', result.error);
    console.log('');

    // Map business errors to HTTP errors
    if (result.error === 'Campaign not found') {
      throw new NotFoundError('Campaign not found');
    }

    if (result.error?.includes('Unauthorized')) {
      throw new UnauthorizedError('You do not own this campaign');
    }

    if (result.error?.includes('Only sent campaigns')) {
      throw new ValidationError('Only sent campaigns can be resent. This campaign is still a draft.');
    }

    // Generic error
    throw new ValidationError(result.error || 'Failed to resend campaign');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ API RESPONSE: 200 OK');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Response:', JSON.stringify({
    success: result.success,
    newDraftId: result.newDraftId,
    originalCampaign: result.originalCampaign
  }, null, 2));
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  return successResponse(
    {
      success: result.success,
      newDraftId: result.newDraftId,
      originalCampaign: result.originalCampaign
    },
    200,
    requestId
  );
}

export const POST = withErrorHandler(handlePost);
