/**
 * GET /api/execution-history/[id]/preview
 *
 * Returns campaign preview data for a historical campaign.
 * Fetches campaign HTML, metadata, and send statistics.
 *
 * Multi-tenant security: Verifies user owns the execution log before returning data.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetCampaignPreviewUseCase } from '@/domain/services/GetCampaignPreviewUseCase';
import { PostgresExecutionLogRepository } from '@/infrastructure/database/repositories/PostgresExecutionLogRepository';
import { PostgresEmailCampaignRepository } from '@/infrastructure/database/repositories/PostgresEmailCampaignRepository';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { ValidationError, NotFoundError, UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/execution-history/[id]/preview
 *
 * Returns campaign preview data for a historical campaign
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns JSON response with campaign preview data
 */
async function handleGet(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  // 1. Get authenticated user session
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const userId = parseInt(session.user.id, 10);

  if (isNaN(userId)) {
    throw new ValidationError('Invalid user ID in session');
  }

  // 2. Parse execution log ID from params
  const { id } = await context!.params;
  const executionLogId = parseInt(id, 10);

  if (isNaN(executionLogId)) {
    throw new ValidationError('Invalid execution log ID', { id });
  }

  // 3. Call GetCampaignPreviewUseCase
  const executionLogRepository = new PostgresExecutionLogRepository();
  const campaignRepository = new PostgresEmailCampaignRepository();
  const userRepository = new PostgresUserRepository();

  const useCase = new GetCampaignPreviewUseCase(
    executionLogRepository,
    campaignRepository,
    userRepository
  );

  let result;
  try {
    result = await useCase.execute({
      executionLogId,
      userId,
    });
  } catch (error) {
    console.error('[API] GetCampaignPreviewUseCase threw error:', error);
    throw error;
  }

  // 4. Handle use case result
  if (!result.success) {
    if (result.error === 'Execution log not found') {
      throw new NotFoundError('Execution log not found', { executionLogId });
    }

    if (result.error === 'Campaign not found') {
      throw new NotFoundError('Campaign not found', { executionLogId });
    }

    if (result.error === 'Unauthorized access to this campaign') {
      throw new UnauthorizedError('Unauthorized access to this campaign');
    }

    if (result.error === 'Campaign data not available for this execution') {
      throw new NotFoundError('Campaign data not available for this execution', {
        executionLogId,
      });
    }

    if (result.error === 'Campaign HTML content not available') {
      throw new NotFoundError('Campaign HTML content not available', {
        executionLogId,
      });
    }

    if (result.error === 'Campaign subject not available') {
      throw new NotFoundError('Campaign subject not available', {
        executionLogId,
      });
    }

    // Generic error
    throw new Error(result.error || 'Failed to retrieve campaign preview');
  }

  // 5. Return success response
  return successResponse(
    {
      campaign: result.campaign,
    },
    200,
    requestId
  );
}

export const GET = withErrorHandler(handleGet);
