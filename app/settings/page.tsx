import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import SettingsClient from './SettingsClient';
import { PATHS } from '@/lib/paths';
import { SettingsLoadError, DatabaseError } from '@/lib/errors';

export default async function SettingsPage() {
  console.log('[SettingsPage] START - Loading settings page');

  try {
    console.log('[SettingsPage] Checking authentication...');
    const session = await auth();

    console.log('[SettingsPage] Auth result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      console.log('[SettingsPage] No session, redirecting to login');
      redirect(PATHS.LOGIN);
    }

    const userId = parseInt(session.user.id);
    console.log('[SettingsPage] User ID parsed:', userId);

    // Fetch user settings using Clean Architecture
    console.log('[SettingsPage] Creating repository and use case...');
    const repository = new PostgresUserSettingsRepository();
    const useCase = new GetUserSettingsUseCase(repository);

    let settings;
    try {
      console.log('[SettingsPage] Executing GetUserSettingsUseCase for userId:', userId);
      settings = await useCase.execute(userId);
      console.log('[SettingsPage] Settings loaded successfully:', {
        hasSettings: !!settings,
        name: settings?.name,
        soundcloudId: settings?.soundcloudId,
        spotifyId: settings?.spotifyId,
      });
    } catch (error) {
      // Wrap database errors with specific error code
      console.error('[SettingsPage] ERROR loading settings:', {
        userId,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error) {
        // Check if it's a database error
        if (error.message.includes('database') || error.message.includes('connection') || error.message.includes('relation')) {
          console.error('[SettingsPage] DATABASE ERROR detected');
          throw new DatabaseError('Failed to connect to database while loading settings', {
            userId,
            originalError: error.message,
            stack: error.stack,
          });
        }

        console.error('[SettingsPage] SETTINGS LOAD ERROR');
        throw new SettingsLoadError(`Failed to load settings for user ${userId}`, {
          userId,
          originalError: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }

    console.log('[SettingsPage] Rendering SettingsClient with:', {
      userName: settings.name || '',
      userEmail: session.user.email || '',
      userId: session.user.id,
      soundcloudId: settings.soundcloudId || '',
      spotifyId: settings.spotifyId || '',
    });

    return (
      <SettingsClient
        userName={settings.name || ''}
        userEmail={session.user.email || ''}
        userId={session.user.id}
        soundcloudId={settings.soundcloudId || ''}
        soundcloudPermalink={settings.soundcloudPermalink || ''}
        spotifyId={settings.spotifyId || ''}
      />
    );
  } catch (error) {
    // Log error details for debugging
    console.error('[SettingsPage] FATAL ERROR - Caught in outer try/catch:', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error; // Let error boundary handle it
  }
}
