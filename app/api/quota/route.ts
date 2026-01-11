/**
 * GET /api/quota
 *
 * Returns current quota status for authenticated user.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // Get authenticated user
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401, undefined, requestId);
  }

  const userId = parseInt(session.user.id);

  // Get use case from factory (DI)
  const checkQuotaUseCase = UseCaseFactory.createCheckQuotaUseCase();

  // Execute use case
  const result = await checkQuotaUseCase.execute({ userId });

  return successResponse(
    {
      emailsSentToday: result.emailsSentToday,
      monthlyLimit: result.monthlyLimit,
      remaining: result.remaining,
      resetDate: result.resetDate.toISOString(),
      allowed: result.allowed,
    },
    200,
    requestId
  );
});
