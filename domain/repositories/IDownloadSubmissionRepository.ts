/**
 * IDownloadSubmissionRepository Interface
 *
 * Defines the contract for download submission data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation (PostgreSQL)
 *
 * Submissions track user interactions with download gates,
 * including OAuth verifications and download status.
 */

import { DownloadSubmission } from '../entities/DownloadSubmission';
import {
  CreateSubmissionInput,
  VerificationStatusUpdate,
  SoundCloudProfile,
  SpotifyProfile,
} from '../types/download-gates';

/**
 * Repository interface for DownloadSubmission
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IDownloadSubmissionRepository {
  /**
   * Create a new download submission
   * @param input - Submission creation data
   * @returns Created submission
   */
  create(input: CreateSubmissionInput): Promise<DownloadSubmission>;

  /**
   * Find submission by ID
   * @param id - Submission UUID
   * @returns Submission or null if not found
   */
  findById(id: string): Promise<DownloadSubmission | null>;

  /**
   * Find submission by email and gate ID
   * Used to prevent duplicate submissions
   * @param email - User email
   * @param gateId - Gate UUID
   * @returns Submission or null if not found
   */
  findByEmailAndGate(email: string, gateId: string): Promise<DownloadSubmission | null>;

  /**
   * Find submission by download token
   * Used when user clicks download link
   * @param token - Download token
   * @returns Submission or null if not found
   */
  findByToken(token: string): Promise<DownloadSubmission | null>;

  /**
   * Find all submissions for a gate
   * Used for analytics and admin dashboard
   * @param gateId - Gate UUID
   * @returns Array of submissions
   */
  findAllByGate(gateId: string): Promise<DownloadSubmission[]>;

  /**
   * Update verification status
   * Used after OAuth verification completes
   * @param id - Submission UUID
   * @param updates - Verification status updates
   * @returns Updated submission
   */
  updateVerificationStatus(
    id: string,
    updates: VerificationStatusUpdate
  ): Promise<DownloadSubmission>;

  /**
   * Generate and save download token
   * Used when all verifications are complete
   * @param id - Submission UUID
   * @param expiresAt - Token expiration date
   * @returns Generated download token
   */
  generateDownloadToken(id: string, expiresAt: Date): Promise<string>;

  /**
   * Mark download as complete
   * Used when user actually downloads the file
   * @param id - Submission UUID
   */
  markDownloadComplete(id: string): Promise<void>;

  /**
   * Update SoundCloud profile data
   * Used after SoundCloud OAuth completes
   * @param id - Submission UUID
   * @param profile - SoundCloud profile data
   */
  updateSoundCloudProfile(id: string, profile: SoundCloudProfile): Promise<void>;

  /**
   * Update Spotify profile data
   * Used after Spotify OAuth completes
   * @param id - Submission UUID
   * @param profile - Spotify profile data
   */
  updateSpotifyProfile(id: string, profile: SpotifyProfile): Promise<void>;
}
