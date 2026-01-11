/**
 * GET /api/demos/[demoId]/analytics
 * Get demo analytics
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetDemoAnalyticsUseCase } from '@/domain/services/GetDemoAnalyticsUseCase';
import {
  demoRepository,
  demoSendRepository,
  demoSupportRepository,
} from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/demos/[demoId]/analytics
 * Returns comprehensive analytics for a demo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ demoId: string }> }
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

    const userId = session.user.id;
    const { demoId } = await params;

    // Execute use case
    const useCase = new GetDemoAnalyticsUseCase(
      demoRepository,
      demoSendRepository,
      demoSupportRepository
    );

    const result = await useCase.execute({ userId: parseInt(userId), demoId });

    if (!result.success) {
      const statusCode = result.error === 'Demo not found' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({ analytics: result.analytics });
  } catch (error) {
    console.error('Error fetching demo analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
