/**
 * SoundCloud Validation Utilities
 *
 * Shared validation functions for SoundCloud use cases.
 * Eliminates code duplication and ensures consistent error handling.
 *
 * Following SOLID principles:
 * - SRP: Each function has one validation responsibility
 * - DRY: Centralized validation logic prevents duplication
 */

import { IDownloadSubmissionRepository } from '@/domain/repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '@/domain/repositories/IDownloadGateRepository';
import { DownloadSubmission } from '@/domain/entities/DownloadSubmission';
import { DownloadGate } from '@/domain/entities/DownloadGate';

/**
 * Typed error class for SoundCloud validation failures
 * Includes error codes for programmatic handling
 */
export class SoundCloudValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SoundCloudValidationError';
  }
}

/**
 * Validate submission exists in database
 * @throws SoundCloudValidationError if submission not found
 */
export async function validateSubmissionExists(
  submissionRepository: IDownloadSubmissionRepository,
  submissionId: string
): Promise<DownloadSubmission> {
  const submission = await submissionRepository.findById(submissionId);
  if (!submission) {
    throw new SoundCloudValidationError(
      'Submission not found',
      'SUBMISSION_NOT_FOUND'
    );
  }
  return submission;
}

/**
 * Validate gate exists in database
 * @throws SoundCloudValidationError if gate not found
 */
export async function validateGateExists(
  gateRepository: IDownloadGateRepository,
  gateId: string
): Promise<DownloadGate> {
  const gate = await gateRepository.findByIdPublic(gateId);
  if (!gate) {
    throw new SoundCloudValidationError(
      'Download gate not found',
      'GATE_NOT_FOUND'
    );
  }
  return gate;
}

/**
 * Validate gate requires repost
 * @throws SoundCloudValidationError if gate does not require repost
 */
export function validateGateRequiresRepost(gate: DownloadGate): void {
  if (!gate.requireSoundcloudRepost) {
    throw new SoundCloudValidationError(
      'This gate does not require SoundCloud repost',
      'REPOST_NOT_REQUIRED'
    );
  }
}

/**
 * Validate gate requires follow
 * @throws SoundCloudValidationError if gate does not require follow
 */
export function validateGateRequiresFollow(gate: DownloadGate): void {
  if (!gate.requireSoundcloudFollow) {
    throw new SoundCloudValidationError(
      'This gate does not require SoundCloud follow',
      'FOLLOW_NOT_REQUIRED'
    );
  }
}

/**
 * Validate gate has SoundCloud track ID
 * @throws SoundCloudValidationError if track ID missing
 */
export function validateGateHasTrackId(gate: DownloadGate): void {
  if (!gate.soundcloudTrackId) {
    throw new SoundCloudValidationError(
      'Gate missing SoundCloud track ID',
      'TRACK_ID_MISSING'
    );
  }
}

/**
 * Validate gate has SoundCloud user ID
 * @throws SoundCloudValidationError if user ID missing
 */
export function validateGateHasUserId(gate: DownloadGate): void {
  if (!gate.soundcloudUserId) {
    throw new SoundCloudValidationError(
      'Gate missing SoundCloud user ID',
      'USER_ID_MISSING'
    );
  }
}
