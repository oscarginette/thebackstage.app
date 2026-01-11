import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { UpdateNotificationPreferencesSchema } from '@/lib/validation-schemas';

/**
 * GET /api/user/notification-preferences
 * Fetch notification preferences for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch preferences
    const useCase = UseCaseFactory.createGetUserNotificationPreferencesUseCase();
    const preferences = await useCase.execute(Number(session.user.id));

    return NextResponse.json(preferences.toJSON());
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Update notification preferences for authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    const validation = UpdateNotificationPreferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Update preferences
    const useCase = UseCaseFactory.createUpdateUserNotificationPreferencesUseCase();
    const preferences = await useCase.execute(Number(session.user.id), {
      autoSendSoundcloud: validatedData.autoSendSoundcloud,
      autoSendSpotify: validatedData.autoSendSpotify,
    });

    return NextResponse.json(preferences.toJSON());
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);

    // Handle validation errors
    if (error.message?.includes('must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
