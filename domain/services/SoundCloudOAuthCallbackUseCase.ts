/**
 * SoundCloudOAuthCallbackUseCase
 *
 * Orchestrates the complete SoundCloud OAuth 2.1 callback flow with PKCE verification.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Exchange authorization code for access token using PKCE code_verifier
 * - Get SoundCloud user profile and update submission
 * - Create repost (ALWAYS - programmatically repost the track)
 * - Create favorite/like (ALWAYS - programmatically like the track)
 * - Create follow (ALWAYS - programmatically follow the artist)
 * - Post comment (ALWAYS if comment text provided - with random timestamp on waveform)
 * - Update track buy link (if enabled - best-effort)
 * - Mark state token as used (prevent replay attacks)
 * - All actions are best-effort and non-blocking (failures don't prevent download)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (OAuth callback orchestration)
 * - DIP: Depends on repository interfaces and provider interfaces
 * - OCP: Easy to extend with new OAuth actions
 *
 * OAuth 2.1 PKCE Flow:
 * 1. User initiates download → Generate code_verifier + code_challenge
 * 2. User authorizes on SoundCloud → Receives authorization code
 * 3. This use case exchanges code + code_verifier for access token
 * 4. PKCE prevents authorization code interception attacks
 *
 * Security:
 * - PKCE prevents authorization code interception (OAuth 2.1)
 * - State token validation (exists, not used, not expired)
 * - One-time use tokens (marked as used even on errors)
 * - Access token never exposed to browser
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IOAuthStateRepository } from '../repositories/IOAuthStateRepository';
import { ISoundCloudClient } from '../providers/ISoundCloudClient';
import { ILogger } from '@/infrastructure/logging/Logger';
import { PostSoundCloudCommentUseCase } from './PostSoundCloudCommentUseCase';
import { UpdateSoundCloudTrackBuyLinkUseCase } from './UpdateSoundCloudTrackBuyLinkUseCase';

/**
 * Input for SoundCloudOAuthCallbackUseCase.execute()
 * Contains OAuth callback parameters and request metadata
 */
export interface SoundCloudOAuthCallbackInput {
  code: string; // Authorization code from SoundCloud
  state: string; // State token for CSRF protection
  redirectUri: string; // OAuth redirect URI (must match authorization request)
  ipAddress?: string; // Client IP for analytics
  userAgent?: string; // Client user agent for analytics
}

/**
 * Result of OAuth callback processing
 * Contains redirect information and success status
 */
export interface SoundCloudOAuthCallbackResult {
  success: boolean;
  gateSlug?: string; // Gate slug for redirect URL
  buyLinkUpdated?: boolean; // True if buy link was updated (for redirect param)
  error?: string; // Error message if processing failed
}

/**
 * SoundCloudOAuthCallbackUseCase
 *
 * Orchestrates the complete OAuth callback flow.
 * Coordinates multiple use cases and repositories to complete authentication.
 */
export class SoundCloudOAuthCallbackUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly oauthStateRepository: IOAuthStateRepository,
    private readonly soundCloudClient: ISoundCloudClient,
    private readonly logger: ILogger,
    private readonly postCommentUseCase: PostSoundCloudCommentUseCase,
    private readonly updateBuyLinkUseCase: UpdateSoundCloudTrackBuyLinkUseCase
  ) {}

  /**
   * Execute OAuth callback processing
   *
   * @param input - OAuth callback data (code, state, redirect URI)
   * @returns Result with gate slug and success status
   */
  async execute(
    input: SoundCloudOAuthCallbackInput
  ): Promise<SoundCloudOAuthCallbackResult> {
    let oauthStateId: string | undefined;

    try {
      // 1. Validate state token (CSRF protection)
      const oauthState = await this.oauthStateRepository.findByStateToken(input.state);

      if (!oauthState) {
        this.logger.warn('Invalid state token', { state: input.state });
        return {
          success: false,
          error: 'Invalid state token',
        };
      }

      // Store state ID for cleanup in catch block
      oauthStateId = oauthState.id;

      if (oauthState.used) {
        this.logger.warn('State token already used', { stateId: oauthState.id });
        return {
          success: false,
          error: 'State token already used',
        };
      }

      if (oauthState.expiresAt < new Date()) {
        this.logger.warn('State token expired', {
          stateId: oauthState.id,
          expiresAt: oauthState.expiresAt,
        });
        return {
          success: false,
          error: 'State token expired',
        };
      }

      if (oauthState.provider !== 'soundcloud') {
        this.logger.warn('Invalid OAuth provider', {
          stateId: oauthState.id,
          provider: oauthState.provider,
        });
        return {
          success: false,
          error: 'Invalid OAuth provider',
        };
      }

      // 2. Validate PKCE code_verifier exists (OAuth 2.1 requirement)
      if (!oauthState.codeVerifier) {
        this.logger.warn('Missing PKCE code verifier', { stateId: oauthState.id });
        return {
          success: false,
          error: 'Invalid authorization request (missing PKCE)',
        };
      }

      // 3. Get gate to construct redirect URL (using public method - no auth required)
      const gate = await this.gateRepository.findByIdPublic(oauthState.gateId.toString());
      if (!gate) {
        this.logger.error('Gate not found', undefined, {
          stateId: oauthState.id,
          gateId: oauthState.gateId,
        });
        return {
          success: false,
          error: 'Gate not found',
        };
      }

      // 4. Exchange code for access token (with PKCE verification)
      this.logger.info('Exchanging authorization code for access token', {
        stateId: oauthState.id,
        gateId: gate.id,
      });

      const tokenResponse = await this.soundCloudClient.exchangeCodeForToken(
        input.code,
        input.redirectUri,
        oauthState.codeVerifier // OAuth 2.1 PKCE verifier
      );

      // 5. Get SoundCloud user profile
      this.logger.info('Fetching SoundCloud user profile', { stateId: oauthState.id });

      const userProfile = await this.soundCloudClient.getUserProfile(
        tokenResponse.access_token
      );

      // 6. Update submission with SoundCloud profile
      await this.submissionRepository.updateSoundCloudProfile(oauthState.submissionId, {
        userId: userProfile.id.toString(),
        username: userProfile.username,
        profileUrl: userProfile.permalink_url,
        avatarUrl: userProfile.avatar_url,
      });

      this.logger.info('Updated submission with SoundCloud profile', {
        submissionId: oauthState.submissionId,
        soundcloudUsername: userProfile.username,
      });

      // 7. Create repost (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudTrackId) {
        await this.createRepost(
          tokenResponse.access_token,
          gate.soundcloudTrackId,
          oauthState.submissionId
        );
      }

      // 7b. Create favorite/like (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudTrackId) {
        await this.createFavorite(
          tokenResponse.access_token,
          gate.soundcloudTrackId,
          oauthState.submissionId
        );
      }

      // 8. Create follow (ALWAYS - best-effort, non-blocking)
      if (gate.soundcloudUserId) {
        await this.createFollow(
          tokenResponse.access_token,
          gate.soundcloudUserId,
          oauthState.submissionId
        );
      }

      // 9. Post comment (ALWAYS if provided - best-effort, non-blocking)
      if (oauthState.commentText && oauthState.commentText.trim().length > 0 && gate.soundcloudTrackId) {
        console.log('[SoundCloudOAuthCallbackUseCase] Preparing to post comment...');

        // Get track info to calculate random timestamp
        let commentTimestamp: number | undefined;
        try {
          const trackInfo = await this.soundCloudClient.getTrackInfo(
            tokenResponse.access_token,
            gate.soundcloudTrackId
          );

          if (trackInfo.duration > 0) {
            // Calculate random timestamp between 10% and 90% of track duration
            // This positions the comment at a random point in the waveform
            const minTime = Math.floor(trackInfo.duration * 0.1);
            const maxTime = Math.floor(trackInfo.duration * 0.9);
            commentTimestamp = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

            console.log('[SoundCloudOAuthCallbackUseCase] Calculated comment timestamp:', {
              trackDuration: trackInfo.duration,
              commentTimestamp,
              position: `${((commentTimestamp / trackInfo.duration) * 100).toFixed(1)}%`,
            });
          }
        } catch (error) {
          console.warn('[SoundCloudOAuthCallbackUseCase] Failed to get track duration (comment will post without timestamp):', error);
          // Continue without timestamp - comment will still be posted
        }

        const commentResult = await this.postCommentUseCase.execute({
          submissionId: oauthState.submissionId,
          accessToken: tokenResponse.access_token,
          soundcloudUserId: userProfile.id,
          commentText: oauthState.commentText,
          commentTimestamp,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        if (!commentResult.success) {
          console.error('[SoundCloudOAuthCallbackUseCase] Comment POST failed (non-critical):', commentResult.error);
          this.logger.warn('Comment POST failed (non-critical)', {
            submissionId: oauthState.submissionId,
            error: commentResult.error,
          });
        } else if (commentResult.posted) {
          console.log('[SoundCloudOAuthCallbackUseCase] Comment posted successfully ✓');
          this.logger.info('Comment posted successfully', {
            submissionId: oauthState.submissionId,
          });
        }
      }

      // 10. Update track buy link (if enabled - best-effort, non-blocking)
      let buyLinkUpdated = false;
      if (gate.enableSoundcloudBuyLink && gate.soundcloudTrackId) {
        const buyLinkResult = await this.updateBuyLinkUseCase.execute({
          gateId: gate.id,
          accessToken: tokenResponse.access_token,
          soundcloudTrackId: gate.soundcloudTrackId,
        });

        if (!buyLinkResult.success) {
          this.logger.warn('Buy link update failed (non-critical)', {
            gateId: gate.id,
            error: buyLinkResult.error,
          });
        } else {
          this.logger.info('Buy link updated successfully', { gateId: gate.id });
          buyLinkUpdated = true;
        }
      }

      // 11. Mark state token as used
      await this.oauthStateRepository.markAsUsed(oauthState.id);

      this.logger.info('OAuth callback processing completed successfully', {
        stateId: oauthState.id,
        gateSlug: gate.slug,
        buyLinkUpdated,
      });

      return {
        success: true,
        gateSlug: gate.slug,
        buyLinkUpdated,
      };
    } catch (error) {
      this.logger.error(
        'OAuth callback processing failed',
        error instanceof Error ? error : new Error(String(error)),
        { state: input.state }
      );

      // Mark state as used to prevent retry attacks
      if (oauthStateId) {
        try {
          await this.oauthStateRepository.markAsUsed(oauthStateId);
          this.logger.info('Marked state as used after error', { stateId: oauthStateId });
        } catch (markError) {
          this.logger.error(
            'Failed to mark state as used after error',
            markError instanceof Error ? markError : new Error(String(markError)),
            { stateId: oauthStateId }
          );
        }
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to complete SoundCloud authentication',
      };
    }
  }

  /**
   * Create repost for track (ALWAYS - best-effort, non-blocking)
   * Updates submission verification status if successful
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID
   * @param submissionId - Submission ID
   */
  private async createRepost(
    accessToken: string,
    trackId: string,
    submissionId: string
  ): Promise<void> {
    try {
      console.log('[SoundCloudOAuthCallbackUseCase] Creating repost for track:', {
        trackId,
        submissionId,
      });
      this.logger.info('Creating repost for track', { trackId, submissionId });

      const repostResult = await this.soundCloudClient.createRepost(accessToken, trackId);

      if (!repostResult.success) {
        console.error('[SoundCloudOAuthCallbackUseCase] Repost creation failed (non-critical):', {
          submissionId,
          trackId,
          error: repostResult.error,
        });
        this.logger.warn('Repost creation failed (non-critical)', {
          submissionId,
          trackId,
          error: repostResult.error,
        });
        return;
      }

      console.log('[SoundCloudOAuthCallbackUseCase] Repost created successfully ✓', {
        submissionId,
        trackId,
      });
      this.logger.info('Repost created successfully', { submissionId, trackId });

      // Update submission verification status
      await this.submissionRepository.updateVerificationStatus(submissionId, {
        soundcloudRepostVerified: true,
      });
    } catch (error) {
      console.error('[SoundCloudOAuthCallbackUseCase] Failed to create repost (non-critical):', error);
      this.logger.error(
        'Failed to create repost (non-critical)',
        error instanceof Error ? error : new Error(String(error)),
        { submissionId, trackId }
      );
    }
  }

  /**
   * Create favorite/like for track (ALWAYS - best-effort, non-blocking)
   *
   * @param accessToken - OAuth access token
   * @param trackId - SoundCloud track ID
   * @param submissionId - Submission ID
   */
  private async createFavorite(
    accessToken: string,
    trackId: string,
    submissionId: string
  ): Promise<void> {
    try {
      console.log('[SoundCloudOAuthCallbackUseCase] Creating favorite/like for track:', {
        trackId,
        submissionId,
      });
      this.logger.info('Creating favorite/like for track', { trackId, submissionId });

      const favoriteResult = await this.soundCloudClient.createFavorite(accessToken, trackId);

      if (!favoriteResult.success) {
        console.error('[SoundCloudOAuthCallbackUseCase] Favorite creation failed (non-critical):', {
          submissionId,
          trackId,
          error: favoriteResult.error,
        });
        this.logger.warn('Favorite creation failed (non-critical)', {
          submissionId,
          trackId,
          error: favoriteResult.error,
        });
        return;
      }

      console.log('[SoundCloudOAuthCallbackUseCase] Favorite created successfully ✓', {
        submissionId,
        trackId,
      });
      this.logger.info('Favorite created successfully', { submissionId, trackId });
    } catch (error) {
      console.error('[SoundCloudOAuthCallbackUseCase] Failed to create favorite (non-critical):', error);
      this.logger.error(
        'Failed to create favorite (non-critical)',
        error instanceof Error ? error : new Error(String(error)),
        { submissionId, trackId }
      );
    }
  }

  /**
   * Create follow for user (ALWAYS - best-effort, non-blocking)
   * Updates submission verification status if successful
   *
   * @param accessToken - OAuth access token
   * @param userId - SoundCloud user ID to follow
   * @param submissionId - Submission ID
   */
  private async createFollow(
    accessToken: string,
    userId: string,
    submissionId: string
  ): Promise<void> {
    try {
      console.log('[SoundCloudOAuthCallbackUseCase] Creating follow for user:', {
        userId,
        submissionId,
      });
      this.logger.info('Creating follow for user', { userId, submissionId });

      const followResult = await this.soundCloudClient.createFollow(accessToken, userId);

      if (!followResult.success) {
        console.error('[SoundCloudOAuthCallbackUseCase] Follow creation failed (non-critical):', {
          submissionId,
          userId,
          error: followResult.error,
        });
        this.logger.warn('Follow creation failed (non-critical)', {
          submissionId,
          userId,
          error: followResult.error,
        });
        return;
      }

      console.log('[SoundCloudOAuthCallbackUseCase] Follow created successfully ✓', {
        submissionId,
        userId,
      });
      this.logger.info('Follow created successfully', { submissionId, userId });

      // Update submission verification status
      await this.submissionRepository.updateVerificationStatus(submissionId, {
        soundcloudFollowVerified: true,
      });
    } catch (error) {
      console.error('[SoundCloudOAuthCallbackUseCase] Failed to create follow (non-critical):', error);
      this.logger.error(
        'Failed to create follow (non-critical)',
        error instanceof Error ? error : new Error(String(error)),
        { submissionId, userId }
      );
    }
  }
}
