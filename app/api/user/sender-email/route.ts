/**
 * PATCH /api/user/sender-email
 *
 * Updates user's custom sender email configuration for newsletters.
 * Validates that the domain is verified before allowing the update.
 *
 * Clean Architecture: Only HTTP orchestration, business logic in Use Case.
 */
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Request body validation schema
 */
const UpdateSenderEmailSchema = z.object({
  senderEmail: z.string().email().nullable(),
  senderName: z.string().min(1).max(255).nullable(),
});

/**
 * PATCH /api/user/sender-email
 * Update authenticated user's sender email configuration
 *
 * Request body:
 * ```json
 * {
 *   "senderEmail": "info@geebeat.com" | null,
 *   "senderName": "Artist Name" | null
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Sender email updated successfully"
 * }
 * ```
 */
export const PATCH = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  console.log('[PATCH /api/user/sender-email] START');

  // 1. Authentication check
  const session = await auth();

  if (!session?.user?.id) {
    console.error('[PATCH /api/user/sender-email] Unauthorized - no session');
    throw new UnauthorizedError();
  }

  const userId = parseInt(session.user.id);

  console.log('[PATCH /api/user/sender-email] User authenticated:', { userId });

  // 2. Parse and validate request body
  const body = await request.json();

  console.log('[PATCH /api/user/sender-email] Request body:', {
    senderEmail: body.senderEmail,
    senderName: body.senderName,
  });

  const validation = UpdateSenderEmailSchema.safeParse(body);

  if (!validation.success) {
    console.error('[PATCH /api/user/sender-email] Validation failed:', validation.error);
    throw new ValidationError('Invalid request body', validation.error.format());
  }

  const { senderEmail, senderName } = validation.data;

  // 3. Execute use case
  const useCase = UseCaseFactory.createUpdateUserSenderEmailUseCase();

  const result = await useCase.execute({
    userId,
    senderEmail,
    senderName,
  });

  console.log('[PATCH /api/user/sender-email] Use case result:', result);

  // 4. Return response
  if (!result.success) {
    return errorResponse(result.message, 'UPDATE_FAILED', 400, requestId);
  }

  return successResponse(
    {
      success: true,
      message: result.message,
    },
    200,
    requestId
  );
});
