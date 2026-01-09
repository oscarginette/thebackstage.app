/**
 * Centralized Error Types
 *
 * All custom error classes for the application.
 * These errors carry semantic meaning and appropriate HTTP status codes.
 *
 * Integration with Error Catalog:
 * - Use ERROR_CODES from error-catalog for consistent error codes
 * - Errors are automatically mapped to i18n message keys
 * - User-friendly messages based on error catalog metadata
 */

import { ERROR_CODES, type ErrorCode } from './errors/error-catalog';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, ERROR_CODES.NOT_FOUND, 404, details);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found', details?: unknown) {
    super(message, ERROR_CODES.USER_NOT_FOUND, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, ERROR_CODES.AUTH_REQUIRED, 401, details);
  }
}

export class AccessDeniedError extends AppError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, 403, details);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.QUOTA_EXCEEDED, 429, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.CONFLICT, 409, details);
  }
}

export class EmailQuotaExceededError extends QuotaExceededError {
  constructor(message: string = 'Email quota exceeded', details?: unknown) {
    super(message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, ERROR_CODES.INTERNAL_ERROR, 500, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.INVALID_INPUT, 400, details);
  }
}

// Settings-specific errors
export class SettingsLoadError extends AppError {
  constructor(message: string = 'Failed to load settings', details?: unknown) {
    super(message, ERROR_CODES.SETTINGS_LOAD_FAILED, 500, details);
  }
}

export class SettingsUpdateError extends AppError {
  constructor(message: string = 'Failed to update settings', details?: unknown) {
    super(message, ERROR_CODES.SETTINGS_UPDATE_FAILED, 500, details);
  }
}

// Database-specific errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, ERROR_CODES.DATABASE_ERROR, 500, details);
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed', details?: unknown) {
    super(message, ERROR_CODES.DATABASE_CONNECTION_FAILED, 503, details);
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
