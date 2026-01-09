/**
 * GET /api/cron/check-spotify-releases
 * Cron Job for Checking Spotify Releases (Protected endpoint)
 *
 * Runs periodically to check for new artist releases and save them to fans' libraries.
 *
 * Schedule: Every 6 hours (configured in vercel.json)
 * - 00:00 UTC
 * - 06:00 UTC
 * - 12:00 UTC
 * - 18:00 UTC
 *
 * Security:
 * - Protected with CRON_SECRET environment variable
 * - Only accessible via Vercel Cron or authorized requests
 *
 * Flow:
 * 1. Validate authorization
 * 2. Fetch subscriptions due for checking
 * 3. Process each subscription (with rate limiting)
 * 4. Log results
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory, RepositoryFactory } from '@/lib/di-container';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * GET /api/cron/check-spotify-releases
 * Check for new releases and save them
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.CRON_SECRET}`;

    if (!env.CRON_SECRET) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('[Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting Spotify release check...');

    // 2. Initialize dependencies
    const subscriptionRepository = RepositoryFactory.createAutoSaveSubscriptionRepository();
    const checkNewReleasesUseCase = UseCaseFactory.createCheckNewReleasesUseCase();

    // 3. Get subscriptions due for check
    const subscriptions = await subscriptionRepository.findDueForCheck();

    console.log(`[Cron] Found ${subscriptions.length} subscriptions to check`);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions due for check',
        checked: 0,
        duration: Date.now() - startTime,
      });
    }

    // 4. Process each subscription
    let successCount = 0;
    let errorCount = 0;
    let totalNewReleases = 0;

    for (const subscription of subscriptions) {
      try {
        console.log('[Cron] Checking subscription:', {
          id: subscription.id,
          artistSpotifyId: subscription.artistSpotifyId,
        });

        const result = await checkNewReleasesUseCase.execute({
          subscriptionId: subscription.id,
        });

        if (result.success) {
          successCount++;
          totalNewReleases += result.newReleases;

          if (result.newReleases > 0) {
            console.log(
              `[Cron] ✅ Saved ${result.newReleases} new releases for subscription ${subscription.id}`
            );
          }
        } else {
          errorCount++;
          console.error(
            `[Cron] ❌ Failed to check subscription ${subscription.id}:`,
            result.error
          );
        }

        // Rate limiting: Wait 100ms between subscriptions to avoid Spotify API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        console.error('[Cron] Error processing subscription:', error);
      }
    }

    const duration = Date.now() - startTime;

    console.log('[Cron] Completed Spotify release check:', {
      checked: subscriptions.length,
      successful: successCount,
      errors: errorCount,
      totalNewReleases,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      checked: subscriptions.length,
      successful: successCount,
      errors: errorCount,
      totalNewReleases,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 }
    );
  }
}
