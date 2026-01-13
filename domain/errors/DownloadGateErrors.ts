/**
 * Download Gate Domain Errors
 *
 * Domain-specific error types for download gate operations.
 * Extends base AppError from centralized error system.
 *
 * Clean Architecture: Domain layer errors with semantic meaning.
 */

import { AppError } from '@/lib/errors';
import { ERROR_CODES } from '@/lib/errors/error-catalog';

/**
 * Invalid Token Error
 * Thrown when download token is malformed or not found
 */
export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid download token', details?: unknown) {
    super(message, ERROR_CODES.AUTH_TOKEN_INVALID, 400, details);
  }
}

/**
 * Expired Token Error
 * Thrown when download token has passed expiration time
 */
export class ExpiredTokenError extends AppError {
  constructor(message: string = 'Download token has expired', details?: unknown) {
    super(message, ERROR_CODES.AUTH_SESSION_EXPIRED, 410, details);
  }
}

/**
 * Track Not Found Error
 * Thrown when referenced track/file doesn't exist
 */
export class TrackNotFoundError extends AppError {
  constructor(message: string = 'Track not found', details?: unknown) {
    super(message, ERROR_CODES.NOT_FOUND, 404, details);
  }
}

/**
 * Gate Not Found Error
 * Thrown when download gate doesn't exist or user doesn't have access
 */
export class GateNotFoundError extends AppError {
  constructor(message: string = 'Download gate not found', details?: unknown) {
    super(message, ERROR_CODES.NOT_FOUND, 404, details);
  }
}

/**
 * Gate Inactive Error
 * Thrown when gate is deactivated or expired
 */
export class GateInactiveError extends AppError {
  constructor(message: string = 'Download gate is no longer active', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, 403, details);
  }
}

/**
 * Gate Expired Error
 * Thrown when gate has passed its expiration date
 */
export class GateExpiredError extends AppError {
  constructor(message: string = 'Download gate has expired', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, 403, details);
  }
}

/**
 * Max Downloads Exceeded Error
 * Thrown when gate has reached maximum download limit
 */
export class MaxDownloadsExceededError extends AppError {
  constructor(message: string = 'Maximum download limit reached', details?: unknown) {
    super(message, ERROR_CODES.QUOTA_EXCEEDED, 429, details);
  }
}

/**
 * Verification Incomplete Error
 * Thrown when required verifications are not complete
 */
export class VerificationIncompleteError extends AppError {
  constructor(message: string = 'Required verifications not completed', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, 403, details);
  }
}

/**
 * Duplicate Submission Error
 * Thrown when user tries to submit to gate they've already submitted to
 */
export class DuplicateSubmissionError extends AppError {
  constructor(message: string = 'You have already submitted to this gate', details?: unknown) {
    super(message, ERROR_CODES.CONFLICT, 409, details);
  }
}

/**
 * Token Already Used Error
 * Thrown when attempting to reuse a one-time download token
 */
export class TokenAlreadyUsedError extends AppError {
  constructor(message: string = 'This download token has already been used', details?: unknown) {
    super(message, ERROR_CODES.CONFLICT, 409, details);
  }
}
