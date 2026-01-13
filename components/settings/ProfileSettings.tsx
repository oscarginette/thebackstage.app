/**
 * ProfileSettings Component
 *
 * Unified Profile + Appearance settings page.
 * Combines user profile (name, email) and theme preferences.
 *
 * Architecture:
 * - Uses SettingsPageHeader for consistent header
 * - Uses SettingsSection for card wrappers
 * - Uses Input component for form fields
 * - Uses ThemeSwitcher for appearance settings
 * - Uses SettingsFormActions for save button + success message
 *
 * Migration:
 * - Merged /settings/profile + /settings/appearance
 * - Before: 131 + 18 lines = 149 lines (2 files)
 * - After: ~130 lines (1 file) using design system
 */

'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n/context';
import { SettingsPageHeader } from './SettingsPageHeader';
import { SettingsSection } from './SettingsSection';
import { SettingsFormActions } from './SettingsFormActions';
import { Input } from '@/components/ui/Input';
import { ThemeSwitcher } from '@/app/settings/ThemeSwitcher';
import { TEXT_STYLES, LAYOUT_STYLES } from '@/domain/types/design-tokens';

interface ProfileSettingsProps {
  initialName: string;
  email: string;
}

export function ProfileSettings({ initialName, email }: ProfileSettingsProps) {
  const t = useTranslations('settings');
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={LAYOUT_STYLES.spacing.section}>
      {/* Unified Page Header */}
      <SettingsPageHeader
        title="Profile & Appearance"
        description="Manage your personal information and preferences"
      />

      {/* Form */}
      <form onSubmit={handleSave} className={LAYOUT_STYLES.spacing.section}>
        {/* Profile Information Section */}
        <SettingsSection
          title="Profile Information"
          description="Update your personal details"
        >
          <div className="grid grid-cols-1 gap-6">
            {/* Name Input - Using Input component from design system */}
            <Input
              label={t('fullName')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              focusVariant="primary"
            />

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className={TEXT_STYLES.label.small}>
                {t('email')}
              </label>
              <div className="w-full h-11 px-4 rounded-xl border border-black/10 bg-black/[0.02] dark:bg-[#111] dark:border-white/5 flex items-center text-foreground/40 text-sm font-medium cursor-not-allowed select-none">
                {email}
              </div>
              <p className={`${TEXT_STYLES.body.muted} ml-1 italic`}>
                Contact support to change your email
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection
          title="Appearance"
          description="Customize how Backstage looks on your device"
        >
          <ThemeSwitcher />
        </SettingsSection>

        {/* Unified Form Actions */}
        <SettingsFormActions
          isSaving={isSaving}
          showSuccess={showSuccess}
          type="submit"
        />
      </form>
    </div>
  );
}
