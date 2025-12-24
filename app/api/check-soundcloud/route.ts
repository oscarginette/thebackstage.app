import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import { CheckNewTracksUseCase } from '@/domain/services/CheckNewTracksUseCase';
import { SendNewTrackEmailsUseCase } from '@/domain/services/SendNewTrackEmailsUseCase';
import {
  trackRepository,
  contactRepository,
  executionLogRepository,
} from '@/infrastructure/database/repositories';
import { soundCloudRepository } from '@/infrastructure/music-platforms';
import { resendEmailProvider } from '@/infrastructure/email';

// Permitir hasta 60s de ejecución
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/check-soundcloud
 * Checks for new tracks and sends emails to subscribers
 *
 * Clean Architecture: Only HTTP concerns (config validation, JSON response)
 * Business logic delegated to CheckNewTracksUseCase and SendNewTrackEmailsUseCase
 */
export async function GET() {
  try {
    const userId = process.env.SOUNDCLOUD_USER_ID;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://backstage-art.vercel.app';

    if (!userId) {
      return NextResponse.json(
        { error: 'SOUNDCLOUD_USER_ID not configured' },
        { status: 400 }
      );
    }

    // 1. Check for new tracks using Clean Architecture
    const checkTracksUseCase = new CheckNewTracksUseCase(
      soundCloudRepository,
      trackRepository
    );

    const checkResult = await checkTracksUseCase.execute({
      artistIdentifier: userId,
      platform: 'soundcloud',
    });

    if (!checkResult.latestTrack) {
      return NextResponse.json({ message: 'No tracks found in feed' });
    }

    const latestTrack = checkResult.latestTrack;

    // 2. Render email HTML
    const emailHtml = await render(
      NewTrackEmail({
        trackName: latestTrack.title,
        trackUrl: latestTrack.url,
        coverImage: latestTrack.coverImage || '',
        unsubscribeUrl: '', // Will be set per contact by use case
      })
    );

    // 3. Send emails to all subscribers
    const sendEmailsUseCase = new SendNewTrackEmailsUseCase(
      contactRepository,
      resendEmailProvider,
      trackRepository,
      executionLogRepository
    );

    const sendResult = await sendEmailsUseCase.execute({
      track: {
        trackId: latestTrack.id,
        title: latestTrack.title,
        url: latestTrack.url,
        publishedAt: latestTrack.publishedAt,
        coverImage: latestTrack.coverImage,
      },
      emailHtml,
      subject: 'Hey mate',
      baseUrl,
    });

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      emailsSent: sendResult.sent,
      emailsFailed: sendResult.failed,
      totalSubscribers: sendResult.totalSubscribers,
      newTracksFound: checkResult.newTracksFound,
    });
  } catch (error: any) {
    console.error('Error in check-soundcloud:', error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
