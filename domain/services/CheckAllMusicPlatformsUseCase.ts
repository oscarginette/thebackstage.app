/**
 * CheckAllMusicPlatformsUseCase
 *
 * Orchestrates checking multiple music platforms (SoundCloud, Spotify) for new releases.
 * Delegates platform-specific logic to individual use cases.
 *
 * Clean Architecture: Business logic in domain layer
 * SOLID Compliance:
 * - SRP: Orchestrates multi-platform checks (single responsibility)
 * - OCP: Easy to add new platforms (just add to platforms array)
 * - DIP: Depends on repository interfaces
 *
 * Benefits:
 * - Centralized multi-platform logic
 * - Cost efficient (single cron job)
 * - Failure isolation (one platform failure doesn't stop others)
 * - Comprehensive reporting across all platforms
 */

import { CheckNewTracksUseCase } from './CheckNewTracksUseCase';
import { SendNewTrackEmailsUseCase } from './SendNewTrackEmailsUseCase';
import { IMusicPlatformRepository } from '../repositories/IMusicPlatformRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { IEmailProvider } from '@/infrastructure/email/IEmailProvider';
import { ITrackRepository } from '../repositories/ITrackRepository';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';
import { sql } from '@/lib/db';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';

export interface PlatformCheckResult {
  userId: number;
  email: string;
  platform: 'soundcloud' | 'spotify';
  success: boolean;
  track?: string;
  emailsSent?: number;
  emailsFailed?: number;
  totalSubscribers?: number;
  newTracksFound?: number;
  message?: string;
  error?: string;
}

export interface CheckAllMusicPlatformsResult {
  success: boolean;
  usersProcessed: number;
  totalEmailsSent: number;
  totalNewTracks: number;
  platformResults: {
    soundcloud: { users: number; emails: number; tracks: number };
    spotify: { users: number; emails: number; tracks: number };
  };
  results: PlatformCheckResult[];
}

export class CheckAllMusicPlatformsUseCase {
  constructor(
    private readonly soundCloudRepository: IMusicPlatformRepository,
    private readonly spotifyRepository: IMusicPlatformRepository,
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly trackRepository: ITrackRepository,
    private readonly executionLogRepository: IExecutionLogRepository,
    private readonly baseUrl: string
  ) {}

  /**
   * Execute multi-platform check for all users
   * @returns Comprehensive results across all platforms
   */
  async execute(): Promise<CheckAllMusicPlatformsResult> {
    console.log('[CheckAllMusicPlatforms] Starting multi-platform check...');

    const results: PlatformCheckResult[] = [];
    let totalEmailsSent = 0;
    let totalNewTracks = 0;

    const platformStats = {
      soundcloud: { users: 0, emails: 0, tracks: 0 },
      spotify: { users: 0, emails: 0, tracks: 0 },
    };

    // 1. Get all active users with any platform configured
    const usersResult = await sql`
      SELECT id, email, soundcloud_id, spotify_id
      FROM users
      WHERE (soundcloud_id IS NOT NULL OR spotify_id IS NOT NULL)
        AND active = true
    `;

    if (usersResult.rowCount === 0) {
      console.log('[CheckAllMusicPlatforms] No users with platforms configured');
      return {
        success: true,
        usersProcessed: 0,
        totalEmailsSent: 0,
        totalNewTracks: 0,
        platformResults: platformStats,
        results: [],
      };
    }

    const users = usersResult.rows;
    console.log(`[CheckAllMusicPlatforms] Found ${users.length} users with platforms configured`);

    // 2. Process each user's platforms
    for (const user of users) {
      // 2.1 Check SoundCloud if configured
      if (user.soundcloud_id) {
        const scResult = await this.checkPlatform(
          user,
          'soundcloud',
          user.soundcloud_id,
          this.soundCloudRepository
        );

        results.push(scResult);

        if (scResult.success && scResult.emailsSent) {
          platformStats.soundcloud.users += 1;
          platformStats.soundcloud.emails += scResult.emailsSent;
          platformStats.soundcloud.tracks += scResult.newTracksFound || 0;
          totalEmailsSent += scResult.emailsSent;
          totalNewTracks += scResult.newTracksFound || 0;
        }
      }

      // 2.2 Check Spotify if configured
      if (user.spotify_id) {
        const spotifyResult = await this.checkPlatform(
          user,
          'spotify',
          user.spotify_id,
          this.spotifyRepository
        );

        results.push(spotifyResult);

        if (spotifyResult.success && spotifyResult.emailsSent) {
          platformStats.spotify.users += 1;
          platformStats.spotify.emails += spotifyResult.emailsSent;
          platformStats.spotify.tracks += spotifyResult.newTracksFound || 0;
          totalEmailsSent += spotifyResult.emailsSent;
          totalNewTracks += spotifyResult.newTracksFound || 0;
        }
      }
    }

    console.log('[CheckAllMusicPlatforms] Completed:', {
      totalUsers: users.length,
      totalEmailsSent,
      totalNewTracks,
      platformStats,
    });

    return {
      success: true,
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
      platformResults: platformStats,
      results,
    };
  }

  /**
   * Check a single platform for a user
   * Delegates to CheckNewTracksUseCase and SendNewTrackEmailsUseCase
   *
   * @param user - User data
   * @param platform - Platform name
   * @param artistId - Platform-specific artist ID
   * @param repository - Platform repository
   * @returns Platform check result
   */
  private async checkPlatform(
    user: any,
    platform: 'soundcloud' | 'spotify',
    artistId: string,
    repository: IMusicPlatformRepository
  ): Promise<PlatformCheckResult> {
    try {
      console.log(`[User ${user.id}] Checking ${platform} for: ${user.email} (ID: ${artistId})`);

      // 1. Check for new tracks
      const checkTracksUseCase = new CheckNewTracksUseCase(
        repository,
        this.trackRepository
      );

      const checkResult = await checkTracksUseCase.execute({
        userId: user.id,
        artistIdentifier: artistId,
        platform,
      });

      // 2. Handle no tracks or no new tracks
      if (!checkResult.latestTrack) {
        console.log(`[User ${user.id}] No tracks found on ${platform}`);
        return {
          userId: user.id,
          email: user.email,
          platform,
          success: true,
          message: 'No tracks found',
          newTracksFound: 0,
        };
      }

      if (checkResult.newTracksFound === 0) {
        console.log(`[User ${user.id}] No new tracks on ${platform}`);
        return {
          userId: user.id,
          email: user.email,
          platform,
          success: true,
          message: 'No new tracks',
          newTracksFound: 0,
        };
      }

      const latestTrack = checkResult.latestTrack;
      console.log(`[User ${user.id}] Found new ${platform} track: ${latestTrack.title}`);

      // 3. Render email HTML
      const emailHtml = await render(
        NewTrackEmail({
          trackName: latestTrack.title,
          trackUrl: latestTrack.url,
          coverImage: latestTrack.coverImage || '',
          unsubscribeUrl: '', // Set per contact by use case
        })
      );

      // 4. Send emails to subscribers
      const sendEmailsUseCase = new SendNewTrackEmailsUseCase(
        this.contactRepository,
        this.emailProvider,
        this.trackRepository,
        this.executionLogRepository
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
        baseUrl: this.baseUrl,
      });

      console.log(`[User ${user.id}] Sent ${sendResult.sent} emails for ${platform} release`);

      return {
        userId: user.id,
        email: user.email,
        platform,
        success: true,
        track: latestTrack.title,
        emailsSent: sendResult.sent,
        emailsFailed: sendResult.failed,
        totalSubscribers: sendResult.totalSubscribers,
        newTracksFound: checkResult.newTracksFound,
      };

    } catch (error: any) {
      console.error(`[User ${user.id}] Error checking ${platform}:`, error);
      return {
        userId: user.id,
        email: user.email,
        platform,
        success: false,
        error: error.message,
      };
    }
  }
}
