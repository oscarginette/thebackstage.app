/**
 * POST /api/send-track
 *
 * Send email for a SoundCloud track with quota enforcement.
 * Uses SendTrackEmailUseCase with quota tracking.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { isAppError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { SendTrackSchema } from '@/lib/validation-schemas';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Send track email with quota enforcement
 *
 * Body:
 * - to: string (required) - Recipient email
 * - subject: string (required) - Email subject
 * - html: string (required) - Email HTML content
 * - from: string (optional) - Sender email
 * - replyTo: string (optional) - Reply-to email
 * - headers: Record<string, string> (optional) - Custom headers
 *
 * Response:
 * {
 *   success: boolean,
 *   messageId?: string,
 *   error?: string,
 *   quotaRemaining: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = SendTrackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get use case from factory (DI)
    const useCase = UseCaseFactory.createSendTrackEmailUseCase();

    // Execute use case with validated data
    const result = await useCase.execute({
      userId,
      to: validatedData.to,
      subject: validatedData.subject,
      html: validatedData.html,
      from: validatedData.from,
      replyTo: validatedData.replyTo,
      headers: validatedData.headers as Record<string, string> | undefined
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error sending track email:', error);

    // Handle known AppError types with proper status codes
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: error.status }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
