/**
 * Test Email API Route
 *
 * Admin endpoint to send a test email for system verification.
 * Tests email sending, tracking, and event handling.
 *
 * Clean Architecture: API route orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import { UseCaseFactory } from '@/lib/di-container';
import { ValidationError } from '@/domain/services/SendTestEmailUseCase';
import { getAppUrl } from '@/lib/env';
import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-email
 * Sends a test email to verify email system
 *
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   recipient: string,
 *   resendId: string,
 *   track: string,
 *   duration: number,
 *   nextSteps: string[]
 * }
 */
export async function POST() {
  const startTime = Date.now();

  try {
    const testEmail = 'noreply@thebackstage.app';
    const baseUrl = getAppUrl();

    // Test track data
    const testTrack = {
      trackId: `test-${Date.now()}`,
      title: '🧪 Test Track - Email System Check',
      url: 'https://soundcloud.com/thebackstage',
      coverImage:
        'https://i1.sndcdn.com/avatars-000000000000-000000-t500x500.jpg',
      publishedAt: new Date().toISOString(),
    };

    // Render email HTML
    const emailHtml = await render(
      NewTrackEmail({
        trackName: testTrack.title,
        trackUrl: testTrack.url,
        coverImage: testTrack.coverImage,
        unsubscribeUrl: '', // Will be set by use case
        customContent: {
          greeting: '🧪 Test Email - System Check',
          message:
            'Testing Email Tracking System - This is a test email to verify email events are being tracked correctly.',
          signature: 'Test System',
        },
        emailSignature: EmailSignature.createGeeBeatDefault().toJSON(),
      })
    );

    // Send test email using use case
    const useCase = UseCaseFactory.createSendTestEmailUseCase();

    const result = await useCase.execute({
      userId: 1, // Default test user
      testEmail,
      emailHtml,
      subject: '🧪 Test Email - System Check',
      track: testTrack,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: result.recipient,
      resendId: result.emailId,
      track: testTrack.title,
      duration: Date.now() - startTime,
      nextSteps: [
        '1. Check your inbox at noreply@thebackstage.app',
        '2. Open the email (this will trigger an "opened" event)',
        '3. Click on the track link (this will trigger a "clicked" event)',
        '4. Visit /stats to see the events being tracked',
      ],
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }

    console.error('Error in test email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
