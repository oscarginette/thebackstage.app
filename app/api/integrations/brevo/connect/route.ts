/**
 * POST /api/integrations/brevo/connect
 *
 * Connects user's Brevo account by validating and storing their API key.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ConnectBrevoSchema } from '@/lib/validation-schemas';
import { ConnectBrevoIntegrationUseCase } from '@/domain/services/ConnectBrevoIntegrationUseCase';
import { PostgresBrevoIntegrationRepository } from '@/infrastructure/database/repositories/PostgresBrevoIntegrationRepository';
import { BrevoAPIClient } from '@/infrastructure/brevo/BrevoAPIClient';

export const maxDuration = 30;

export async function POST(request: Request) {
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

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = ConnectBrevoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { apiKey } = validation.data;

    // 3. Initialize use case with repositories
    const brevoIntegrationRepository = new PostgresBrevoIntegrationRepository();
    const brevoAPIClient = new BrevoAPIClient(apiKey);
    const useCase = new ConnectBrevoIntegrationUseCase(
      brevoIntegrationRepository,
      brevoAPIClient
    );

    // 4. Execute use case
    const result = await useCase.execute({ userId, apiKey });

    // 5. Return result
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Error connecting Brevo:', error);

    // Handle validation errors (e.g., invalid API key)
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect Brevo account', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
