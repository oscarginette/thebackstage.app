import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PostgresUserRepository } from '@/infrastructure/database/repositories/PostgresUserRepository';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch full user data including name
  const userRepository = new PostgresUserRepository();
  const user = await userRepository.findById(parseInt(session.user.id));

  if (!user) {
    redirect('/login');
  }

  return (
    <SettingsClient
      userName={user.name || ''}
      userEmail={user.email}
    />
  );
}
