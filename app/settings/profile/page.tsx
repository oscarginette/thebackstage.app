import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { PATHS } from '@/lib/paths';

export default async function ProfilePage() {
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
    // Ideally handle error better, but for now we proceed with minimal data
    settings = {};
  }

  return (
    <ProfileSettings
      initialName={settings?.name || ''}
      email={session.user.email || ''}
    />
  );
}
