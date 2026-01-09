/**
 * GET /api/download/[token]
 * Process download using token (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 * Returns 302 redirect to file URL upon successful validation.
 */

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download/[token]
 * Process download and redirect to file URL
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

    // Initialize use case
    const processDownloadUseCase = UseCaseFactory.createProcessDownloadUseCase();

    // Execute
    const result = await processDownloadUseCase.execute({
      downloadToken: token,
    });

    if (!result.success) {
      if (result.error?.includes('expired')) {
        return NextResponse.json(
          { error: result.error },
          { status: 410 } // 410 Gone (expired)
        );
      }

      if (result.error?.includes('already been used')) {
        return NextResponse.json(
          { error: result.error },
          { status: 409 } // 409 Conflict (already used)
        );
      }

      if (result.error?.includes('not found') || result.error?.includes('Invalid')) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Redirect to file URL (302 temporary redirect)
    if (result.fileUrl) {
      redirect(result.fileUrl);
    }

    // Fallback: return file URL as JSON
    return NextResponse.json({
      fileUrl: result.fileUrl,
    });
  } catch (error) {
    console.error('GET /api/download/[token] error:', error);

    // Handle Next.js redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
