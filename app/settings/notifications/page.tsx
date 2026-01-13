'use client';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { NotificationPreferencesSection } from '../NotificationPreferencesSection';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Notifications"
        description="Manage your email notification preferences"
      />

      <SettingsSection>
        <NotificationPreferencesSection />
      </SettingsSection>
    </div>
  );
}
