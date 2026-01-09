/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel tracking configuration for a download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 * Security: Requires authentication, verifies gate ownership.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import {
  NotFoundError,
  ValidationError,
} from '@/domain/services/UpdatePixelConfigUseCase';

export const dynamic = 'force-dynamic';

interface UpdatePixelConfigBody {
  pixelConfig: {
    facebook?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
      testEventCode?: string;
    };
    google?: {
      enabled: boolean;
      tagId: string;
      conversionLabels?: {
        view?: string;
        submit?: string;
        download?: string;
      };
    };
    tiktok?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
  };
}

/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel configuration for a gate
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gateId } = await params;
    const userId = parseInt(session.user.id);

    // Parse request body
    const body: UpdatePixelConfigBody = await request.json();

    // Execute use case
    const useCase = UseCaseFactory.createUpdatePixelConfigUseCase();
    const result = await useCase.execute({
      userId,
      gateId,
      pixelConfig: body.pixelConfig,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH /api/download-gates/[id]/pixel-config error:', error);

    // Handle domain errors
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update pixel configuration' },
      { status: 500 }
    );
  }
}
