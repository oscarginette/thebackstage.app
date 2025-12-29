import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import SettingsClient from './SettingsClient';
import { PATHS } from '@/lib/paths';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(PATHS.LOGIN);
  }

  // Fetch user settings using Clean Architecture
  const repository = new PostgresUserSettingsRepository();
  const useCase = new GetUserSettingsUseCase(repository);
  const settings = await useCase.execute(parseInt(session.user.id));

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
}
