/**
 * GET /api/gate/[slug]
 * Get download gate configuration (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { GetDownloadGateUseCase } from '@/domain/services/GetDownloadGateUseCase';
import { TrackGateAnalyticsUseCase } from '@/domain/services/TrackGateAnalyticsUseCase';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { serializePublicGate } from '@/lib/serialization';

// Singleton repository instances
const gateRepository = new PostgresDownloadGateRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();

export const dynamic = 'force-dynamic';

/**
 * GET /api/gate/[slug]
 * Returns public gate configuration
 * Tracks view event
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Initialize use case
    const getGateUseCase = new GetDownloadGateUseCase(gateRepository);

    // Execute
    const gate = await getGateUseCase.executeBySlug({ slug });

    if (!gate) {
      return NextResponse.json(
        { error: 'Download gate not found' },
        { status: 404 }
      );
    }

    // Track view analytics (fire and forget)
    const trackAnalyticsUseCase = new TrackGateAnalyticsUseCase(
      analyticsRepository,
      gateRepository
    );

    // Extract analytics data from request
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    // Parse URL for UTM parameters
    const url = new URL(request.url);
    const utmSource = url.searchParams.get('utm_source') || undefined;
    const utmMedium = url.searchParams.get('utm_medium') || undefined;
    const utmCampaign = url.searchParams.get('utm_campaign') || undefined;

    // Track view event (async, non-blocking)
    trackAnalyticsUseCase.execute({
      gateId: parseInt(gate.id),
      eventType: 'view',
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      ipAddress,
      userAgent,
    }).catch((error) => {
      console.error('Failed to track view analytics (non-critical):', error);
    });

    // Serialize and return only public fields
    const serializedGate = serializePublicGate(gate);

    return NextResponse.json({ gate: serializedGate });
  } catch (error) {
    console.error('GET /api/gate/[slug] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
