/**
 * CheckAllUsersSoundCloudReleasesUseCase
 *
 * Multi-tenant use case that checks for new SoundCloud tracks for ALL users.
 * Orchestrates per-user track checking and email sending.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (orchestrates multi-tenant SoundCloud checks),
 *        Dependency Inversion (depends on interfaces).
 */

import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import { IUserRepository } from '../repositories/IUserRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { ITrackRepository } from '../repositories/ITrackRepository';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';
import { IMusicPlatformRepository } from '../repositories/IMusicPlatformRepository';
import { IEmailProvider } from '../../infrastructure/email/IEmailProvider';
import { CheckNewTracksUseCase } from './CheckNewTracksUseCase';
import { SendNewTrackEmailsUseCase } from './SendNewTrackEmailsUseCase';
import { EmailSignature } from '../value-objects/EmailSignature';

export interface CheckAllUsersSoundCloudReleasesInput {
  baseUrl: string;
}

export interface UserSoundCloudResult {
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

export interface CheckAllUsersSoundCloudReleasesResult {
  success: boolean;
  usersProcessed: number;
  totalEmailsSent: number;
  totalNewTracks: number;
  results: UserSoundCloudResult[];
}

export class CheckAllUsersSoundCloudReleasesUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly soundCloudRepository: IMusicPlatformRepository,
    private readonly trackRepository: ITrackRepository,
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly executionLogRepository: IExecutionLogRepository
  ) {}

  async execute(
    input: CheckAllUsersSoundCloudReleasesInput
  ): Promise<CheckAllUsersSoundCloudReleasesResult> {
    console.log('[CheckAllUsersSoundCloudReleasesUseCase] START');

    // 1. Get all active users with SoundCloud configured
    const users = await this.userRepository.findUsersWithSoundCloudConfigured();

    if (users.length === 0) {
      console.log('[CheckAllUsersSoundCloudReleasesUseCase] No users with SoundCloud configured');
      return {
        success: true,
        usersProcessed: 0,
        totalEmailsSent: 0,
        totalNewTracks: 0,
        results: [],
      };
    }

    console.log(
      `[CheckAllUsersSoundCloudReleasesUseCase] Found ${users.length} users with SoundCloud configured`
    );

    const results: UserSoundCloudResult[] = [];
    let totalEmailsSent = 0;
    let totalNewTracks = 0;

    // 2. Process each user's SoundCloud feed
    for (const user of users) {
      try {
        const soundcloudId = user.soundcloudId;

        if (!soundcloudId) {
          console.log(`[User ${user.id}] Missing SoundCloud ID, skipping`);
          results.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: 'Missing SoundCloud ID',
          });
          continue;
        }

        console.log(
          `[User ${user.id}] Checking SoundCloud feed for: ${user.email} (SC ID: ${soundcloudId})`
        );

        // 2.1 Check for new tracks for this user
        const checkNewTracksUseCase = new CheckNewTracksUseCase(
          this.soundCloudRepository,
          this.trackRepository
        );

        const checkResult = await checkNewTracksUseCase.execute({
          userId: user.id,
          artistIdentifier: soundcloudId,
          platform: 'soundcloud',
        });

        if (!checkResult.latestTrack) {
          console.log(`[User ${user.id}] No tracks found in feed`);
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            message: 'No tracks found',
            newTracksFound: 0,
          });
          continue;
        }

        if (checkResult.newTracksFound === 0) {
          console.log(`[User ${user.id}] No new tracks`);
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            message: 'No new tracks',
            newTracksFound: 0,
          });
          continue;
        }

        const latestTrack = checkResult.latestTrack;
        console.log(`[User ${user.id}] Found new track: ${latestTrack.title}`);

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
        const sendNewTrackEmailsUseCase = new SendNewTrackEmailsUseCase(
          this.contactRepository,
          this.emailProvider,
          this.trackRepository,
          this.executionLogRepository
        );

        const sendResult = await sendNewTrackEmailsUseCase.execute({
          userId: user.id,
          track: {
            trackId: latestTrack.id,
            title: latestTrack.title,
            url: latestTrack.url,
            publishedAt: latestTrack.publishedAt,
            coverImage: latestTrack.coverImage,
          },
          emailHtml,
          subject: 'Hey mate',
          baseUrl: input.baseUrl,
        });

        totalEmailsSent += sendResult.sent;
        totalNewTracks += checkResult.newTracksFound;

        console.log(`[User ${user.id}] Sent ${sendResult.sent} emails`);

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
      } catch (userError: unknown) {
        const errorMessage =
          userError instanceof Error ? userError.message : 'Unknown error';
        console.error(`[User ${user.id}] Error processing:`, userError);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: errorMessage,
        });
      }
    }

    console.log('[CheckAllUsersSoundCloudReleasesUseCase] COMPLETE:', {
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
    });

    return {
      success: true,
      usersProcessed: users.length,
      totalEmailsSent,
      totalNewTracks,
      results,
    };
  }
}
