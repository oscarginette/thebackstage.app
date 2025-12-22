/**
 * GET /api/download-gates
 * List all download gates for authenticated user
 *
 * POST /api/download-gates
 * Create new download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ListDownloadGatesUseCase } from '@/domain/services/ListDownloadGatesUseCase';
import { CreateDownloadGateUseCase } from '@/domain/services/CreateDownloadGateUseCase';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { PostgresDownloadAnalyticsRepository } from '@/infrastructure/database/repositories/PostgresDownloadAnalyticsRepository';
import { serializeGate, serializeGateWithStats } from '@/lib/serialization';

// Singleton repository instances
const gateRepository = new PostgresDownloadGateRepository();
const analyticsRepository = new PostgresDownloadAnalyticsRepository();

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates
 * Returns all gates for authenticated user with stats
 */
export async function GET(request: Request) {
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

    // Initialize use case
    const listGatesUseCase = new ListDownloadGatesUseCase(
      gateRepository,
      analyticsRepository
    );

    // Execute
    const gatesWithStats = await listGatesUseCase.execute(userId);

    // Serialize dates to ISO strings
    const serializedGates = gatesWithStats.map(({ gate, stats }) => {
      // Map the use case stats to GateStats format
      const gateStats = {
        gateId: parseInt(gate.id),
        totalViews: stats.totalViews,
        totalSubmissions: stats.totalSubmissions,
        totalDownloads: stats.totalDownloads,
        conversionRate: stats.conversionRate,
        soundcloudReposts: 0,
        soundcloudFollows: 0,
        spotifyConnects: 0,
      };
      return serializeGateWithStats(gate, gateStats);
    });

    return NextResponse.json({ gates: serializedGates });
  } catch (error) {
    console.error('GET /api/download-gates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download-gates
 * Create new download gate
 */
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();

    // Initialize use case
    const createGateUseCase = new CreateDownloadGateUseCase(gateRepository);

    // Execute
    const result = await createGateUseCase.execute(userId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Serialize gate
    const serializedGate = serializeGate(result.gate!);

    return NextResponse.json(
      { gate: serializedGate },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/download-gates error:', error);

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
