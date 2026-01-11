/**
 * DELETE /api/integrations/brevo/disconnect
 *
 * Disconnects user's Brevo integration by deactivating it.
 * Keeps historical data for audit purposes.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DisconnectBrevoIntegrationUseCase } from '@/domain/services/DisconnectBrevoIntegrationUseCase';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';

export async function DELETE() {
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
    const useCase = new DisconnectBrevoIntegrationUseCase(brevoIntegrationRepository);

    // 3. Execute use case
    const result = await useCase.execute({ userId });

    // 4. Return result
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error disconnecting Brevo:', error);

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to disconnect Brevo account', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
