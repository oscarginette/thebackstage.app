import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import BrevoIntegration from '../BrevoIntegration';
import { PATHS } from '@/lib/paths';

export default async function IntegrationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(PATHS.LOGIN);
  }

  const userId = parseInt(session.user.id);
  const repository = new PostgresUserSettingsRepository();
  const useCase = new GetUserSettingsUseCase(repository);

  let settings;
  try {
    settings = await useCase.execute(userId);
  } catch (error) {
    console.error('Failed to load settings:', error);
    settings = {};
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Platform Connections"
        description="Connect external platforms to your Backstage account"
      />

      <IntegrationsSettings
        initialSoundcloudId={settings?.soundcloudId || ''}
        initialSoundcloudPermalink={settings?.soundcloudPermalink || ''}
        initialSpotifyId={settings?.spotifyId || ''}
      />

      <BrevoIntegration userId={session.user.id} />
    </div>
  );
}
