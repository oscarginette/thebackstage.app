/**
 * GET /api/quota
 *
 * Returns current quota status for authenticated user.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // TODO: Get userId from session/auth middleware
  // For now, using placeholder - replace with actual auth
  const userId = 1; // Replace with: const { userId } = await getSession(request);

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
