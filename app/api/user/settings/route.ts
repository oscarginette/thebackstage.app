/**
 * GET/PATCH /api/user/settings
 *
 * Handles user settings retrieval and updates.
 * Clean Architecture: Only HTTP orchestration, no business logic.
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError } from '@/lib/errors';
import { UpdateUserSettingsSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/settings
 * Retrieve authenticated user's settings
 */
export const GET = withErrorHandler(async () => {
  const requestId = generateRequestId();
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  // Get use case from factory (DI)
  const useCase = UseCaseFactory.createGetUserSettingsUseCase();

  const settings = await useCase.execute(parseInt(session.user.id));

  return successResponse(
    {
      settings: settings.toJSON()
    },
    200,
    requestId
  );
});

/**
 * PATCH /api/user/settings
 * Update authenticated user's settings
 */
export const PATCH = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const body = await request.json();

  // Validate request body
  const validation = UpdateUserSettingsSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.format());
  }

  const validatedData = validation.data;

  // Extract SoundCloud ID and permalink from URL if provided
  let soundcloudId = validatedData.soundcloudId;
  let soundcloudPermalink: string | undefined = undefined;

  if (validatedData.soundcloudUrl) {
    try {
      const origin = new URL(request.url).origin;
      const extractRes = await fetch(`${origin}/api/soundcloud/extract-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validatedData.soundcloudUrl })
      });

      if (extractRes.ok) {
        const extractData = await extractRes.json();
        soundcloudId = extractData.userId;        // Numeric ID (e.g., "1318247880")
        soundcloudPermalink = extractData.permalink; // Username (e.g., "thebackstage")
      } else {
        // If extraction fails, treat it as invalid
        soundcloudId = undefined;
        soundcloudPermalink = undefined;
      }
    } catch (error) {
      console.error('Failed to extract SoundCloud ID:', error);
      soundcloudId = undefined;
      soundcloudPermalink = undefined;
    }
  }

  // Extract Spotify ID from URL if provided (TODO: implement similar logic)
  let spotifyId = validatedData.spotifyId || validatedData.spotifyUrl;

  // Get use case from factory (DI)
  const useCase = UseCaseFactory.createUpdateUserSettingsUseCase();

  const settings = await useCase.execute(parseInt(session.user.id), {
    name: validatedData.name,
    soundcloudId,
    soundcloudPermalink,
    spotifyId,
    instagramUrl: validatedData.instagramUrl
  });

  return successResponse(
    {
      settings: settings.toJSON()
    },
    200,
    requestId
  );
});
