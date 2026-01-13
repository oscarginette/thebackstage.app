/**
 * GET /api/download/[token]
 * File download endpoint with token validation (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 *
 * Flow:
 * 1. Process download (validates token + marks complete + increments analytics)
 * 2. Redirect to file URL
 *
 * USAGE:
 * ```
 * GET /api/download/{token}
 * Response: 302 Redirect to file URL
 * ```
 */

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { UseCaseFactory } from '@/lib/di-container';
import {
  InvalidTokenError,
  ExpiredTokenError,
  TokenAlreadyUsedError,
  GateInactiveError,
  GateExpiredError,
} from '@/domain/errors/DownloadGateErrors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download/[token]
 * Processes download and serves file
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token format
    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: 'Download token is required' },
        { status: 400 }
      );
    }

    // Process download (atomic operation: validate + mark complete + analytics)
    const processDownloadUseCase = UseCaseFactory.createProcessDownloadUseCase();

    const result = await processDownloadUseCase.execute({
      downloadToken: token,
    });

    // Redirect to file URL (302 temporary redirect)
    // Using redirect() for proper Next.js handling
    redirect(result.fileUrl);
  } catch (error) {
    console.error('GET /api/download/[token] error:', error);

    // Handle Next.js redirect (not an error)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    // Domain error handling with correct HTTP status codes
    if (error instanceof InvalidTokenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ExpiredTokenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 410 } // 410 Gone (expired resource)
      );
    }

    if (error instanceof TokenAlreadyUsedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // 409 Conflict (already used)
      );
    }

    if (error instanceof GateInactiveError || error instanceof GateExpiredError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 } // 403 Forbidden (gate no longer active)
      );
    }

    // Unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
