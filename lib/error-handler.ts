/**
 * Centralized Error Handler
 *
 * Provides consistent error handling and response formatting for API routes.
 * Implements request tracking, error logging, and standardized error responses.
 *
 * Usage:
 *   export const POST = withErrorHandler(async (request: Request) => {
 *     // Your handler logic
 *   });
 */

import { NextResponse } from 'next/server';
import {
  AppError,
  ValidationError,
  NotFoundError,
  AccessDeniedError,
  QuotaExceededError,
  UnauthorizedError,
  ConflictError,
} from './errors';

export interface ErrorResponse {
  error: string;
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;
}

/**
 * Creates a standardized error response
 *
 * Handles both known AppError instances and unexpected errors.
 * All unexpected errors are logged with full context.
 * Uses error catalog for consistent error codes and messages.
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Handle known app errors with proper status codes
  if (error instanceof AppError) {
    // Log known errors with context
    console.error(`[${requestId}] AppError (${error.code}):`, {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        requestId,
      },
      { status: error.status }
    );
  }

  // Handle unexpected errors (always 500)
  const errorMessage = error instanceof Error ? error.message : 'Internal server error';

  // Log unexpected errors for monitoring and debugging
  console.error(`[${requestId}] Unexpected error:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    error: error instanceof Error ? error : String(error),
    requestId,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: errorMessage,
      code: 'UNEXPECTED_ERROR',
      status: 500,
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Generates unique request ID for tracking
 *
 * Format: req_<timestamp>_<random>
 * Example: req_1704067200000_x7k3m9p2q
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order function that wraps API route handlers with error handling
 *
 * Automatically catches and formats errors, adds request IDs, and logs requests.
 *
 * @example
 * export const POST = withErrorHandler(async (request: Request) => {
 *   const body = await request.json();
 *   const result = await useCase.execute(body);
 *   return successResponse(result);
 * });
 */
export function withErrorHandler<T = unknown>(
  handler: (request: Request, context?: T) => Promise<Response>
) {
  return async (request: Request, context?: T): Promise<Response> => {
    const requestId = generateRequestId();

    try {
      // Log incoming request
      logRequest(request.method, request.url, requestId);

      return await handler(request, context);
    } catch (error: unknown) {
      return createErrorResponse(error, requestId);
    }
  };
}

/**
 * Logs incoming API requests with metadata
 *
 * Includes request ID, method, URL, and timestamp for audit trail.
 */
export function logRequest(
  method: string,
  url: string,
  requestId: string,
  userId?: number
): void {
  console.log(`[${requestId}] ${method} ${url}`, {
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Type guard utilities for error handling
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return 'UNKNOWN_ERROR';
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}
