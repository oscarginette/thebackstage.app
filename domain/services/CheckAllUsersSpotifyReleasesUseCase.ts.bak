/**
 * CheckAllUsersSpotifyReleasesUseCase
 *
 * Orchestrates checking for new Spotify releases across all users.
 * This is a multi-tenant use case that iterates over all users with Spotify configured,
 * checks for new releases, and sends emails to their subscribers.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (orchestrates multi-tenant Spotify checking),
 *        Dependency Inversion (depends on interfaces).
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { ITrackRepository } from '../repositories/ITrackRepository';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';
import { IMusicPlatformRepository } from '../repositories/IMusicPlatformRepository';
import { IEmailProvider } from '../../infrastructure/email/IEmailProvider';
import { CheckNewTracksUseCase } from './CheckNewTracksUseCase';
import { SendNewTrackEmailsUseCase } from './SendNewTrackEmailsUseCase';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import { EmailSignature } from '../value-objects/EmailSignature';

export interface CheckAllUsersSpotifyReleasesInput {
  baseUrl: string;
}

export interface UserSpotifyResult {
  userId: number;
  email: string;
  success: boolean;
  message?: string;
  track?: string;
  emailsSent?: number;
  emailsFailed?: number;
  totalSubscribers?: number;
  newTracksFound?: number;
  error?: string;
}

export interface CheckAllUsersSpotifyReleasesResult {
  success: boolean;
  platform: string;
  usersProcessed: number;
  totalEmailsSent: number;
  totalNewTracks: number;
  results: UserSpotifyResult[];
}

export class CheckAllUsersSpotifyReleasesUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly spotifyRepository: IMusicPlatformRepository,
    private readonly trackRepository: ITrackRepository,
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly executionLogRepository: IExecutionLogRepository
  ) {}

  async execute(input: CheckAllUsersSpotifyReleasesInput): Promise<CheckAllUsersSpotifyReleasesResult> {
    console.log('[CheckAllUsersSpotifyReleasesUseCase] START');

    // 1. Get all active users with Spotify configured
    const users = await this.userRepository.findUsersWithSpotifyConfigured();

    if (users.length === 0) {
      console.log('[CheckAllUsersSpotifyReleasesUseCase] No users with Spotify configured');
      return {
        success: true,
        platform: 'spotify',
        usersProcessed: 0,
        totalEmailsSent: 0,
        totalNewTracks: 0,
        results: [],
      };
    }

    console.log(`[CheckAllUsersSpotifyReleasesUseCase] Found ${users.length} users with Spotify configured`);

    const results: UserSpotifyResult[] = [];
    let totalEmailsSent = 0;
    let totalNewTracks = 0;

    // 2. Process each user's Spotify releases
    for (const user of users) {
      try {
        const userResult = await this.processUserSpotifyReleases(user.id, user.email, user.spotifyId!, input.baseUrl);
        results.push(userResult);

        totalEmailsSent += userResult.emailsSent ?? 0;
        totalNewTracks += userResult.newTracksFound ?? 0;
      } catch (userError: any) {
        console.error(`[CheckAllUsersSpotifyReleasesUseCase] Error processing user ${user.id}:`, userError);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: userError.message,
        });
      }
    }

    console.log('[CheckAllUsersSpotifyReleasesUseCase] Complete:', {
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
    });

    return {
      success: true,
      platform: 'spotify',
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
      results,
    };
  }

  /**
   * Process Spotify releases for a single user
   * Handles checking for new tracks and sending emails
   * Isolated to prevent one user's failure from affecting others
   */
  private async processUserSpotifyReleases(
    userId: number,
    email: string,
    spotifyId: string,
    baseUrl: string
  ): Promise<UserSpotifyResult> {
    console.log(`[CheckAllUsersSpotifyReleasesUseCase] Processing user ${userId}: ${email} (Spotify ID: ${spotifyId})`);

    // 1. Check for new tracks
    const checkTracksUseCase = new CheckNewTracksUseCase(
      this.spotifyRepository,
      this.trackRepository
    );

    const checkResult = await checkTracksUseCase.execute({
      userId,
      artistIdentifier: spotifyId,
      platform: 'spotify',
    });

    // 2. Handle no tracks found
    if (!checkResult.latestTrack) {
      console.log(`[CheckAllUsersSpotifyReleasesUseCase] User ${userId}: No tracks found in Spotify`);
      return {
        userId,
        email,
        success: true,
        message: 'No tracks found',
        newTracksFound: 0,
      };
    }

    // 3. Handle no new releases
    if (checkResult.newTracksFound === 0) {
      console.log(`[CheckAllUsersSpotifyReleasesUseCase] User ${userId}: No new Spotify releases`);
      return {
        userId,
        email,
        success: true,
        message: 'No new releases',
        newTracksFound: 0,
      };
    }

    const latestTrack = checkResult.latestTrack;
    console.log(`[CheckAllUsersSpotifyReleasesUseCase] User ${userId}: Found new Spotify release: ${latestTrack.title}`);

    // 4. Render email HTML
    const emailHtml = await render(
      NewTrackEmail({
        trackName: latestTrack.title,
        trackUrl: latestTrack.url,
        coverImage: latestTrack.coverImage || '',
        unsubscribeUrl: '', // Will be set per contact by use case
        emailSignature: EmailSignature.createGeeBeatDefault().toJSON(),
      })
    );

    // 5. Send emails to this user's subscribers
    const sendEmailsUseCase = new SendNewTrackEmailsUseCase(
      this.contactRepository,
      this.emailProvider,
      this.trackRepository,
      this.executionLogRepository
    );

    const sendResult = await sendEmailsUseCase.execute({
      userId,
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

    console.log(`[CheckAllUsersSpotifyReleasesUseCase] User ${userId}: Sent ${sendResult.sent} emails for Spotify release`);

    return {
      userId,
      email,
      success: true,
      track: latestTrack.title,
      emailsSent: sendResult.sent,
      emailsFailed: sendResult.failed,
      totalSubscribers: sendResult.totalSubscribers,
      newTracksFound: checkResult.newTracksFound,
    };
  }
}
