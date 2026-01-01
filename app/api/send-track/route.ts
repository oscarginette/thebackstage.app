/**
 * POST /api/send-track
 *
 * Send new track announcement email to all subscribed contacts.
 * Uses SendNewTrackEmailsUseCase to batch send to subscribers.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { UseCaseFactory } from '@/lib/di-container';
import { isAppError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { SendTrackSchema } from '@/lib/validation-schemas';
import { getAppUrl } from '@/lib/env';
import NewTrackEmail from '@/emails/new-track';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Send new track email to all subscribed contacts
 *
 * Body:
 * - trackId: string (required) - Track ID
 * - title: string (required) - Track title
 * - url: string (required) - Track URL
 * - coverImage: string (optional) - Cover image URL
 * - publishedAt: string (required) - Published date
 * - customContent: object (optional) - Custom email content
 *   - subject: string (optional) - Email subject
 *   - greeting: string (optional) - Email greeting
 *   - message: string (optional) - Email message
 *   - signature: string (optional) - Email signature
 *
 * Response:
 * {
 *   success: boolean,
 *   sent: number,
 *   failed: number,
 *   totalSubscribers: number,
 *   error?: string
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

    // Build email subject
    const subject = validatedData.customContent?.subject || `New Track: ${validatedData.title}`;

    // Generate HTML from React email template
    const emailHtml = await render(
      NewTrackEmail({
        trackName: validatedData.title,
        trackUrl: validatedData.url,
        coverImage: validatedData.coverImage || '',
        customContent: validatedData.customContent,
      })
    );

    // Get use case from factory (DI)
    const useCase = UseCaseFactory.createSendNewTrackEmailsUseCase();

    // Execute use case with validated data
    const result = await useCase.execute({
      userId,
      track: {
        trackId: validatedData.trackId,
        title: validatedData.title,
        url: validatedData.url,
        coverImage: validatedData.coverImage,
        publishedAt: validatedData.publishedAt,
      },
      emailHtml,
      subject,
      baseUrl: getAppUrl(),
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
