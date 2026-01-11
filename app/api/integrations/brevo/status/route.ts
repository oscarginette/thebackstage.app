/**
 * GET /api/integrations/brevo/status
 *
 * Returns the current status of the user's Brevo integration.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetBrevoIntegrationStatusUseCase } from '@/domain/services/GetBrevoIntegrationStatusUseCase';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Initialize use case with repository
    const brevoIntegrationRepository = new PostgresBrevoIntegrationRepository();
    const useCase = new GetBrevoIntegrationStatusUseCase(brevoIntegrationRepository);

    // 3. Execute use case
    const status = await useCase.execute({ userId });

    // 4. Return result
    return NextResponse.json(status);

  } catch (error: unknown) {
    console.error('Error fetching Brevo status:', error);

    return NextResponse.json(
      { error: 'Failed to fetch Brevo status', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
