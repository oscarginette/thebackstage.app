import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import SettingsClient from './SettingsClient';
import { PATHS } from '@/lib/paths';
import { SettingsLoadError, DatabaseError } from '@/lib/errors';

export default async function SettingsPage() {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect(PATHS.LOGIN);
    }

    // Fetch user settings using Clean Architecture
    const repository = new PostgresUserSettingsRepository();
    const useCase = new GetUserSettingsUseCase(repository);

    let settings;
    try {
      settings = await useCase.execute(parseInt(session.user.id));
    } catch (error) {
      // Wrap database errors with specific error code
      if (error instanceof Error) {
        console.error('Settings load error:', {
          userId: session.user.id,
          error: error.message,
          stack: error.stack,
        });

        // Check if it's a database error
        if (error.message.includes('database') || error.message.includes('connection')) {
          throw new DatabaseError('Failed to connect to database while loading settings', {
            userId: session.user.id,
            originalError: error.message,
          });
        }

        throw new SettingsLoadError(`Failed to load settings for user ${session.user.id}`, {
          userId: session.user.id,
          originalError: error.message,
        });
      }
      throw error;
    }

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
    console.error('Settings page error:', error);
    throw error; // Let error boundary handle it
  }
}
