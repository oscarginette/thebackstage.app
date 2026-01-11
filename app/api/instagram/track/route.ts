/**
 * Instagram Click Tracking Endpoint
 *
 * Tracks when a user clicks to visit an Instagram profile.
 * Returns the Instagram URL for client-side redirect.
 *
 * Query Parameters:
 * - submissionId: UUID of the download submission
 * - gateId: UUID of the download gate
 *
 * Response:
 * - 200: { success: true, instagramUrl: string, alreadyTracked: boolean }
 * - 400: { error: string } (validation error)
 * - 404: { error: string } (submission/gate not found)
 * - 500: { error: string } (server error)
 *
 * Clean Architecture: Presentation layer (pure orchestration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrackInstagramClickUseCase } from '@/domain/services/TrackInstagramClickUseCase';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const gateId = searchParams.get('gateId');

    // 2. Validate parameters
    if (!submissionId || !gateId) {
      return NextResponse.json(
        { error: 'Missing required parameters: submissionId, gateId' },
        { status: 400 }
      );
    }

    // 3. Get IP address and User-Agent for analytics
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // 4. Create use case with repository dependencies (DIP)
    const submissionRepository = new PostgresDownloadSubmissionRepository();
    const gateRepository = new PostgresDownloadGateRepository();
    const analyticsRepository = new PostgresDownloadAnalyticsRepository();

    const useCase = new TrackInstagramClickUseCase(
      submissionRepository,
      gateRepository,
      analyticsRepository
    );

    // 5. Execute use case
    const result = await useCase.execute({
      submissionId,
      gateId,
      ipAddress,
      userAgent,
    });

    // 6. Handle result
    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      instagramUrl: result.instagramUrl,
      alreadyTracked: result.alreadyTracked,
    });
  } catch (error) {
    console.error('Instagram track endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
