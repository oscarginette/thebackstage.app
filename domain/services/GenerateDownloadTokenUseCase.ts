/**
 * GenerateDownloadTokenUseCase
 *
 * Generates a secure download token when all verifications are complete.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Verify submission exists
 * - Check all required verifications completed (Phase 1: email only)
 * - Check gate not expired or max downloads reached
 * - Generate secure token using crypto
 * - Set expiry (24h from now)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (token generation)
 * - DIP: Depends on repository interfaces
 *
 * SECURITY: Uses crypto.randomBytes for secure token generation
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { sql } from '@vercel/postgres';

export interface GenerateDownloadTokenInput {
  submissionId: string; // UUID
}

export interface GenerateDownloadTokenResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export class GenerateDownloadTokenUseCase {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository
  ) {}

  /**
   * Execute token generation
   * @param input - Submission ID
   * @returns GenerateDownloadTokenResult with token or error
   */
  async execute(input: GenerateDownloadTokenInput): Promise<GenerateDownloadTokenResult> {
    try {
      console.log('[GenerateDownloadTokenUseCase] Starting execution:', { submissionId: input.submissionId });

      // 1. Find submission
      const submission = await this.submissionRepository.findById(input.submissionId);
      console.log('[GenerateDownloadTokenUseCase] Submission found:', {
        exists: !!submission,
        id: submission?.id,
        gateId: submission?.gateId,
      });

      if (!submission) {
        console.error('[GenerateDownloadTokenUseCase] Submission not found');
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      // 2. Check if token already exists and is still valid
      if (submission.downloadToken && submission.downloadTokenExpiresAt) {
        console.log('[GenerateDownloadTokenUseCase] Existing token found:', {
          hasToken: !!submission.downloadToken,
          expiresAt: submission.downloadTokenExpiresAt,
          isValid: submission.downloadTokenExpiresAt > new Date(),
        });

        if (submission.downloadTokenExpiresAt > new Date()) {
          console.log('[GenerateDownloadTokenUseCase] Reusing existing valid token');
          // Return existing valid token
          return {
            success: true,
            token: submission.downloadToken,
            expiresAt: submission.downloadTokenExpiresAt,
          };
        }
      }

      // 3. Find gate using gateId from submission
      // For public submissions, we query without userId validation
      // The submission already validates the gate relationship
      console.log('[GenerateDownloadTokenUseCase] Fetching gate:', { gateId: submission.gateId });
      const gate = await this.getGateForSubmission(submission.gateId);
      console.log('[GenerateDownloadTokenUseCase] Gate found:', {
        exists: !!gate,
        active: gate?.active,
        slug: gate?.slug,
      });

      if (!gate) {
        console.error('[GenerateDownloadTokenUseCase] Gate not found');
        return {
          success: false,
          error: 'Download gate not found',
        };
      }

      // 4. Check gate is still active
      // Note: gate is raw DB row (snake_case fields)
      if (!gate.active) {
        return {
          success: false,
          error: 'This download gate is no longer active',
        };
      }

      // Check gate not expired
      if (gate.expires_at && new Date(gate.expires_at) < new Date()) {
        return {
          success: false,
          error: 'This download gate has expired',
        };
      }

      // 5. Verify all required verifications are complete
      console.log('[GenerateDownloadTokenUseCase] Checking verifications:', {
        soundcloudRepostVerified: submission.soundcloudRepostVerified,
        soundcloudFollowVerified: submission.soundcloudFollowVerified,
        spotifyConnected: submission.spotifyConnected,
        instagramClickTracked: submission.instagramClickTracked,
        requireSoundcloudRepost: gate.require_soundcloud_repost,
        requireSoundcloudFollow: gate.require_soundcloud_follow,
        requireSpotify: gate.require_spotify_connect,
        requireInstagram: gate.require_instagram_follow,
      });

      const verificationsComplete = this.checkVerificationsComplete(submission, gate);
      console.log('[GenerateDownloadTokenUseCase] Verification result:', verificationsComplete);

      if (!verificationsComplete.complete) {
        console.error('[GenerateDownloadTokenUseCase] Verifications incomplete:', verificationsComplete.error);
        return {
          success: false,
          error: verificationsComplete.error,
        };
      }

      // 6. Check max downloads not reached
      if (gate.max_downloads !== null) {
        const currentDownloads = await this.gateRepository.getDownloadCount(gate.id);
        if (currentDownloads >= gate.max_downloads) {
          return {
            success: false,
            error: 'Maximum download limit reached for this gate',
          };
        }
      }

      // 7. Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      console.log('[GenerateDownloadTokenUseCase] Generating new token...');

      // 8. Generate and save token to submission (repository generates the token)
      const token = await this.submissionRepository.generateDownloadToken(input.submissionId, expiresAt);

      console.log('[GenerateDownloadTokenUseCase] Token generated successfully:', {
        tokenLength: token?.length,
        expiresAt,
      });

      return {
        success: true,
        token,
        expiresAt,
      };
    } catch (error) {
      console.error('GenerateDownloadTokenUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download token',
      };
    }
  }

  /**
   * Check if all required verifications are complete
   * Validates based on gate requirements
   * @param submission - Download submission entity
   * @param gate - Download gate database row (snake_case fields)
   * @returns Verification status
   */
  private checkVerificationsComplete(submission: any, gate: any): {
    complete: boolean;
    error?: string;
  } {
    // Note: gate comes from DB (snake_case), submission is entity (camelCase)

    // Check email verification if required
    if (gate.require_email && !submission.emailVerified) {
      return {
        complete: false,
        error: 'Email verification required',
      };
    }

    // Check SoundCloud repost verification if required
    if (gate.require_soundcloud_repost && !submission.soundcloudRepostVerified) {
      return {
        complete: false,
        error: 'SoundCloud repost verification required',
      };
    }

    // Check SoundCloud follow verification if required
    if (gate.require_soundcloud_follow && !submission.soundcloudFollowVerified) {
      return {
        complete: false,
        error: 'SoundCloud follow verification required',
      };
    }

    // Check Spotify connection if required
    if (gate.require_spotify_connect && !submission.spotifyConnected) {
      return {
        complete: false,
        error: 'Spotify connection required',
      };
    }

    // Check Instagram click if required
    if (gate.require_instagram_follow && !submission.instagramClickTracked) {
      return {
        complete: false,
        error: 'Instagram follow required',
      };
    }

    return { complete: true };
  }

  /**
   * Get gate for public submission
   *
   * ARCHITECTURE NOTE: This temporarily violates Clean Architecture by using SQL directly
   * in the domain layer. This is a pragmatic workaround because:
   *
   * 1. IDownloadGateRepository.findById requires userId for security
   * 2. Public submissions don't store userId (only gateId)
   * 3. We need gate properties to validate download requirements
   * 4. The submission was already validated when created (gate relationship is valid)
   *
   * PROPER FIX: Add findByIdPublic(gateId) to IDownloadGateRepository interface
   *
   * @param gateId - Gate ID from submission
   * @returns Gate database row or null
   */
  private async getGateForSubmission(gateId: string): Promise<any> {
    try {
      const result = await sql`
        SELECT * FROM download_gates
        WHERE id = ${gateId}
        LIMIT 1
      `;
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('getGateForSubmission error:', error);
      return null;
    }
  }
}
