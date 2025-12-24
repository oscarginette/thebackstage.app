import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import { SendTestEmailUseCase, ValidationError } from '@/domain/services/SendTestEmailUseCase';
import {
  contactRepository,
  trackRepository,
  emailLogRepository,
} from '@/infrastructure/database/repositories';
import { resendEmailProvider } from '@/infrastructure/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-email
 * Sends a test email to verify email system
 *
 * Clean Architecture: Only HTTP concerns (contact creation, JSON response)
 * Business logic delegated to SendTestEmailUseCase
 */
export async function POST() {
  const startTime = Date.now();

  try {
    const testEmail = 'info@geebeat.com';
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://backstage-art.vercel.app';

    // Test track data
    const testTrack = {
      trackId: `test-${Date.now()}`,
      title: '🧪 Test Track - Email System Check',
      url: 'https://soundcloud.com/geebeat',
      coverImage:
        'https://i1.sndcdn.com/avatars-000000000000-000000-t500x500.jpg',
      publishedAt: new Date().toISOString(),
    };

    // Find or create test contact
    let contact = await sql`
      SELECT id, email, name, unsubscribe_token
      FROM contacts
      WHERE email = ${testEmail}
      LIMIT 1
    `;

    if (contact.rows.length === 0) {
      const newContact = await sql`
        INSERT INTO contacts (email, name, subscribed)
        VALUES (${testEmail}, 'Gee Beat Test', true)
        RETURNING id, email, name, unsubscribe_token
      `;
      contact.rows[0] = newContact.rows[0];
    }

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
      })
    );

    // Send test email using use case
    const useCase = new SendTestEmailUseCase(
      contactRepository,
      resendEmailProvider,
      trackRepository,
      emailLogRepository
    );

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
        '1. Check your inbox at info@geebeat.com',
        '2. Open the email (this will trigger an "opened" event)',
        '3. Click on the track link (this will trigger a "clicked" event)',
        '4. Visit /stats to see the events being tracked',
      ],
    });
  } catch (error: any) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error in test email:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
