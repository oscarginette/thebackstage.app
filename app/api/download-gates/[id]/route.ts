/**
 * GET /api/download-gates/[id]
 * Get download gate by ID (authenticated)
 *
 * PATCH /api/download-gates/[id]
 * Update download gate
 *
 * DELETE /api/download-gates/[id]
 * Delete download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetDownloadGateUseCase } from '@/domain/services/GetDownloadGateUseCase';
import { UpdateDownloadGateUseCase } from '@/domain/services/UpdateDownloadGateUseCase';
import { DeleteDownloadGateUseCase } from '@/domain/services/DeleteDownloadGateUseCase';
import { GetGateStatsUseCase } from '@/domain/services/GetGateStatsUseCase';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { serializeGate, serializeGateWithStats } from '@/lib/serialization';

// Singleton repository instances
const gateRepository = new PostgresDownloadGateRepository();
const submissionRepository = new PostgresDownloadSubmissionRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates/[id]
 * Returns gate by ID for authenticated user with stats
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;

    // Initialize use cases
    const getGateUseCase = new GetDownloadGateUseCase(gateRepository);
    const getStatsUseCase = new GetGateStatsUseCase(gateRepository, analyticsRepository);

    // Execute
    const gate = await getGateUseCase.executeById({ userId, gateId: id });

    if (!gate) {
      return NextResponse.json(
        { error: 'Gate not found or access denied' },
        { status: 404 }
      );
    }

    // Get stats
    const statsResult = await getStatsUseCase.execute({ userId, gateId: id });

    if (!statsResult.success || !statsResult.stats) {
      return NextResponse.json(
        { error: statsResult.error || 'Failed to retrieve stats' },
        { status: 500 }
      );
    }

    // Map domain stats to frontend format
    const frontendStats = {
      views: statsResult.stats.totalViews,
      submissions: statsResult.stats.totalSubmissions,
      downloads: statsResult.stats.totalDownloads,
      conversionRate: statsResult.stats.conversionRate,
      soundcloudReposts: statsResult.stats.soundcloudReposts,
      soundcloudFollows: statsResult.stats.soundcloudFollows,
      spotifyConnections: statsResult.stats.spotifyConnects,
    };

    // Serialize gate with stats
    const serializedGate = {
      ...serializeGate(gate),
      stats: frontendStats
    };

    return NextResponse.json({ gate: serializedGate });
  } catch (error) {
    console.error('GET /api/download-gates/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/download-gates/[id]
 * Update download gate
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;

    // Parse request body
    const body = await request.json();

    // Initialize use case
    const updateGateUseCase = new UpdateDownloadGateUseCase(
      gateRepository,
      submissionRepository
    );

    // Execute
    const result = await updateGateUseCase.execute(userId, id, body);

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
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

    // Serialize gate
    const serializedGate = serializeGate(result.gate!);

    return NextResponse.json({ gate: serializedGate });
  } catch (error) {
    console.error('PATCH /api/download-gates/[id] error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/download-gates/[id]
 * Delete download gate
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;

    // Initialize use case
    const deleteGateUseCase = new DeleteDownloadGateUseCase(gateRepository);

    // Execute
    const result = await deleteGateUseCase.execute(userId, id);

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/download-gates/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
