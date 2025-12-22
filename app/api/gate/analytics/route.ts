/**
 * POST /api/gate/analytics
 * Track analytics events (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 * Fire-and-forget analytics tracking, non-blocking.
 */

import { NextResponse } from 'next/server';
import { TrackGateAnalyticsUseCase } from '@/domain/services/TrackGateAnalyticsUseCase';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';

// Singleton repository instances
const analyticsRepository = new PostgresDownloadAnalyticsRepository();
const gateRepository = new PostgresDownloadGateRepository();

export const dynamic = 'force-dynamic';

/**
 * POST /api/gate/analytics
 * Track analytics event (view, submit, download)
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      gateId,
      eventType,
      sessionId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      country,
    } = body;

    // Validate required fields
    if (!gateId) {
      return NextResponse.json(
        { error: 'Gate ID is required' },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Extract IP and user agent from request
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Initialize use case
    const trackAnalyticsUseCase = new TrackGateAnalyticsUseCase(
      analyticsRepository,
      gateRepository
    );

    // Execute (fire and forget)
    const result = await trackAnalyticsUseCase.execute({
      gateId: parseInt(gateId),
      eventType,
      sessionId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      ipAddress,
      userAgent,
      country,
    });

    // Return success even if tracking failed (non-blocking)
    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('POST /api/gate/analytics error:', error);

    // Fire and forget: return success even on error
    // Don't block user flow for analytics failures
    return NextResponse.json({ success: false });
  }
}
