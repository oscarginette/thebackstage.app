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
import { spotifyRepository } from '@/infrastructure/music-platforms';
import { resendEmailProvider } from '@/infrastructure/email';
import { sql } from '@/lib/db';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';
import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/check-spotify
 *
 * Multi-tenant endpoint that checks for new Spotify releases for ALL users with Spotify configured.
 * Iterates over each user with a spotify_id and checks their latest albums/singles.
 *
 * Clean Architecture: Only HTTP concerns (config validation, JSON response)
 * Business logic delegated to CheckNewTracksUseCase and SendNewTrackEmailsUseCase
 */
export async function GET() {
  try {
    const baseUrl =
      getAppUrl();

    // 1. Get all active users with Spotify configured
    const usersResult = await sql`
      SELECT id, spotify_id, email
      FROM users
      WHERE spotify_id IS NOT NULL
        AND spotify_id != ''
        AND active = true
    `;

    if (usersResult.rowCount === 0) {
      return NextResponse.json({
        message: 'No users with Spotify configured',
        usersProcessed: 0
      });
    }

    const users = usersResult.rows;
    console.log(`[Check Spotify] Found ${users.length} users with Spotify configured`);

    const results = [];
    let totalEmailsSent = 0;
    let totalNewTracks = 0;

    // 2. Process each user's Spotify releases
    for (const user of users) {
      try {
        console.log(`[User ${user.id}] Checking Spotify releases for: ${user.email} (Spotify ID: ${user.spotify_id})`);

        // 2.1 Check for new tracks for this user
        const checkTracksUseCase = new CheckNewTracksUseCase(
          spotifyRepository,
          trackRepository
        );

        const checkResult = await checkTracksUseCase.execute({
          userId: user.id,
          artistIdentifier: user.spotify_id,
          platform: 'spotify',
        });

        if (!checkResult.latestTrack) {
          console.log(`[User ${user.id}] No tracks found in Spotify`);
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            message: 'No tracks found',
            newTracksFound: 0
          });
          continue;
        }

        if (checkResult.newTracksFound === 0) {
          console.log(`[User ${user.id}] No new Spotify releases`);
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            message: 'No new releases',
            newTracksFound: 0
          });
          continue;
        }

        const latestTrack = checkResult.latestTrack;
        console.log(`[User ${user.id}] Found new Spotify release: ${latestTrack.title}`);

        // 2.2 Render email HTML
        const emailHtml = await render(
          NewTrackEmail({
            trackName: latestTrack.title,
            trackUrl: latestTrack.url,
            coverImage: latestTrack.coverImage || '',
            unsubscribeUrl: '', // Will be set per contact by use case
            emailSignature: EmailSignature.createGeeBeatDefault().toJSON(),
          })
        );

        // 2.3 Send emails to this user's subscribers
        const sendEmailsUseCase = new SendNewTrackEmailsUseCase(
          contactRepository,
          resendEmailProvider,
          trackRepository,
          executionLogRepository
        );

        const sendResult = await sendEmailsUseCase.execute({
          userId: user.id,
          track: {
            trackId: latestTrack.id,
            title: latestTrack.title,
            url: latestTrack.url,
            publishedAt: latestTrack.publishedAt,
            coverImage: latestTrack.coverImage,
          },
          emailHtml,
          subject: `🎵 New Release: ${latestTrack.title}`,
          baseUrl,
        });

        totalEmailsSent += sendResult.sent;
        totalNewTracks += checkResult.newTracksFound;

        console.log(`[User ${user.id}] Sent ${sendResult.sent} emails for Spotify release`);

        results.push({
          userId: user.id,
          email: user.email,
          success: true,
          track: latestTrack.title,
          emailsSent: sendResult.sent,
          emailsFailed: sendResult.failed,
          totalSubscribers: sendResult.totalSubscribers,
          newTracksFound: checkResult.newTracksFound,
        });

      } catch (userError: any) {
        console.error(`[User ${user.id}] Error processing Spotify:`, userError);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: userError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      platform: 'spotify',
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
      results,
    });
  } catch (error: unknown) {
    console.error('Error in check-spotify:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
