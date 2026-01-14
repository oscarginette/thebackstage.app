/**
 * POST /api/campaigns/[id]/send
 *
 * Send a draft campaign to all subscribed contacts.
 *
 * Clean Architecture + SOLID:
 * - API route only orchestrates (no business logic)
 * - Business logic in SendDraftUseCase (domain layer)
 * - Depends on abstractions via DI container
 *
 * Test Mode:
 * - Set TEST_EMAIL_ONLY=true in .env to only send to info@geebeat.com
 * - This allows testing the full flow without spamming contacts
 */

import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/send
 *
 * Sends a draft campaign to all subscribed contacts.
 *
 * Requirements:
 * - User must be authenticated
 * - Campaign must exist and belong to user
 * - Campaign status must be 'draft' (not already sent)
 * - At least one subscribed contact must exist
 *
 * Response:
 * - success: boolean
 * - campaignId: string
 * - emailsSent: number (count of successful sends)
 * - emailsFailed: number (count of failed sends)
 * - totalContacts: number (total recipients)
 * - duration: number (execution time in ms)
 * - failures: Array<{email, error}> (optional, only if failures occurred)
 *
 * Errors:
 * - 401: Not authenticated
 * - 400: Validation error (campaign already sent, no contacts, etc)
 * - 404: Campaign not found
 * - 500: Server error
 */
async function handlePost(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    console.log('❌ API: Unauthorized request');
    throw new UnauthorizedError('Authentication required');
  }

  const { id: campaignId } = await context!.params;
  const requestId = generateRequestId();

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 API REQUEST: POST /api/campaigns/[id]/send');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Request ID:', requestId);
  console.log('Session User ID:', session.user.id);
  console.log('Campaign ID:', campaignId);
  console.log('');

  const userIdNumber = parseInt(session.user.id);

  console.log('Converted User ID:', userIdNumber);
  console.log('');

  // Instantiate use case via DI container (SOLID: Dependency Inversion)
  const sendDraftUseCase = UseCaseFactory.createSendDraftUseCase();

  // Execute business logic (all logic delegated to use case)
  console.log('📞 Calling SendDraftUseCase.execute()...');
  console.log('');

  const result = await sendDraftUseCase.execute({
    userId: userIdNumber,
    draftId: campaignId
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ API RESPONSE: 200 OK');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Response:', JSON.stringify({
    success: result.success,
    campaignId: result.campaignId,
    emailsSent: result.emailsSent,
    emailsFailed: result.emailsFailed,
    totalContacts: result.totalContacts,
    duration: `${result.duration}ms`
  }, null, 2));
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  return successResponse(
    {
      success: result.success,
      campaignId: result.campaignId,
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed,
      totalContacts: result.totalContacts,
      duration: result.duration,
      failures: result.failures
    },
    200,
    requestId
  );
}

export const POST = withErrorHandler(handlePost);
