/**
 * PostSoundCloudCommentUseCase
 *
 * Posts pre-written comment to SoundCloud track after OAuth authentication.
 * Part of Hypeddit-style flow: user writes comment BEFORE auth, we post AFTER.
 *
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate comment text exists and is non-empty
 * - Get gate's soundcloud_track_id for target track
 * - POST comment via SoundCloud API
 * - Graceful failure: log error but allow download (best-effort service)
 * - Track analytics event
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (comment posting on SoundCloud)
 * - DIP: Depends on repository interfaces and SoundCloud client abstraction
 *
 * OAuth Flow:
 * 1. User writes comment during gate interaction
 * 2. User authenticates with SoundCloud via OAuth
 * 3. This use case posts the comment on the authenticated track
 * 4. Comment posting succeeds/fails independently of download flow
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { ISoundCloudClient } from '../providers/ISoundCloudClient';
import { ILogger } from '@/infrastructure/logging/Logger';
import {
  validateSubmissionExists,
  validateGateHasTrackId,
  SoundCloudValidationError,
} from '../utils/soundcloud-validation';

/**
 * Input for PostSoundCloudCommentUseCase.execute()
 * Contains necessary data to post comment to SoundCloud track
 */
export interface PostSoundCloudCommentInput {
  submissionId: string;
  accessToken: string;
  soundcloudUserId: number;
  commentText: string;
  commentTimestamp?: number; // Optional timestamp in milliseconds (positions comment on waveform)
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Result of attempting to post SoundCloud comment
 * Always returns success: true (best-effort service)
 * Failures are logged but don't block user download flow
 */
export interface PostSoundCloudCommentResult {
  success: boolean;
  posted?: boolean; // True if comment was actually posted, false if skipped
  error?: string; // Error message if something went wrong
}

/**
 * PostSoundCloudCommentUseCase
 *
 * Orchestrates posting a comment to SoundCloud.
 * Implements best-effort semantics: failures logged but don't block downloads.
 */
export class PostSoundCloudCommentUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly soundCloudClient: ISoundCloudClient,
    private readonly logger: ILogger
  ) {}

  /**
   * Execute comment posting flow
   *
   * @param input - PostSoundCloudCommentInput with comment text, access token, etc.
   * @returns PostSoundCloudCommentResult (always success: true for best-effort)
   */
  async execute(input: PostSoundCloudCommentInput): Promise<PostSoundCloudCommentResult> {
    try {
      // 1. Validate submission exists (uses shared validation)
      const submission = await validateSubmissionExists(
        this.submissionRepository,
        input.submissionId
      );

      // 2. Validate comment text
      if (!input.commentText || input.commentText.trim().length === 0) {
        this.logger.warn('Comment text is empty, skipping comment posting', {
          submissionId: input.submissionId,
        });
        return {
          success: true,
          posted: false,
          error: 'Comment text is empty (skipped)',
        };
      }

      // 3. Get gate to find target track
      const gate = await this.gateRepository.findById(1, submission.gateId.toString());
      if (!gate) {
        this.logger.warn('Gate not found, skipping comment posting', {
          submissionId: input.submissionId,
          gateId: submission.gateId,
        });
        return {
          success: true,
          posted: false,
          error: 'Gate not found (skipped comment)',
        };
      }

      // 4. Validate gate has SoundCloud track configured (uses shared validation)
      validateGateHasTrackId(gate);

      // 5. Post comment via SoundCloud API (with optional timestamp)
      await this.soundCloudClient.postComment(
        input.accessToken,
        gate.soundcloudTrackId!,
        input.commentText,
        input.commentTimestamp
      );

      this.logger.info('SoundCloud comment posted successfully', {
        submissionId: input.submissionId,
        gateId: gate.id,
        trackId: gate.soundcloudTrackId,
        timestamp: input.commentTimestamp,
      });

      // 6. Track analytics event (non-critical, doesn't block result)
      await this.trackCommentPostedEvent(gate.id, input);

      return {
        success: true,
        posted: true,
      };
    } catch (error) {
      // Best-effort: log error but return success
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Use structured logger instead of console.error
      this.logger.error(
        'Failed to post SoundCloud comment',
        error instanceof Error ? error : undefined,
        {
          submissionId: input.submissionId,
          errorMessage,
        }
      );

      // Track failed comment attempt for monitoring
      try {
        await this.trackCommentFailedEvent(input.submissionId, errorMessage);
      } catch (trackingError) {
        this.logger.error(
          'Failed to track comment failure event',
          trackingError instanceof Error ? trackingError : undefined,
          {
            submissionId: input.submissionId,
          }
        );
      }

      // Return success (best-effort): comment failure doesn't block download
      return {
        success: true,
        posted: false,
        error: `Failed to post comment: ${errorMessage}`,
      };
    }
  }

  /**
   * Track successful comment posting event
   * Non-critical: Failure doesn't affect comment result
   *
   * @param gateId - Gate ID
   * @param input - Comment input data
   */
  private async trackCommentPostedEvent(
    gateId: string,
    input: PostSoundCloudCommentInput
  ): Promise<void> {
    try {
      await this.analyticsRepository.track({
        gateId: gateId,
        eventType: 'submit', // Using 'submit' as base type (extend EventType if needed)
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (error) {
      // Non-critical error: comment already posted, just tracking failed
      this.logger.warn(
        'Failed to track comment_posted event (non-critical)',
        {
          gateId,
          submissionId: input.submissionId,
        }
      );
    }
  }

  /**
   * Track failed comment posting attempt
   * Used for monitoring and debugging
   *
   * @param submissionId - Submission ID
   * @param errorMessage - Error message from failed attempt
   */
  private async trackCommentFailedEvent(
    submissionId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      // Get submission to extract gateId for tracking
      const submission = await this.submissionRepository.findById(submissionId);
      if (submission) {
        this.logger.warn('Comment posting failed', {
          submissionId,
          gateId: submission.gateId,
          errorMessage,
        });
      }
    } catch (error) {
      this.logger.error(
        'Failed to track comment failure',
        error instanceof Error ? error : undefined,
        { submissionId }
      );
    }
  }
}
