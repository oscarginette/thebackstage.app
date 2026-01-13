'use client';

import { useState, useEffect } from 'react';
import { SettingsFormActions } from '@/components/settings/SettingsFormActions';
import { TEXT_STYLES } from '@/domain/types/design-tokens';

interface NotificationPreferences {
  autoSendSoundcloud: boolean;
  autoSendSpotify: boolean;
}

export function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notification-preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences({
        autoSendSoundcloud: data.autoSendSoundcloud,
        autoSendSpotify: data.autoSendSpotify,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }

      setSuccessMessage('Preferences updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (field: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-foreground/50">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Notification Options - Simple Checkboxes */}
      <div className="space-y-4">
        {/* SoundCloud Auto-Send */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={preferences.autoSendSoundcloud}
            onChange={() => togglePreference('autoSendSoundcloud')}
            className="w-4 h-4 rounded border-black/20 dark:border-white/20 text-accent focus:ring-2 focus:ring-accent/20 cursor-pointer"
          />
          <div className="flex-1">
            <span className={`${TEXT_STYLES.body.base} font-medium block`}>
              SoundCloud New Tracks
            </span>
            <span className={TEXT_STYLES.body.subtle}>
              Auto-email subscribers on new releases
            </span>
          </div>
        </label>

        {/* Spotify Auto-Send */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={preferences.autoSendSpotify}
            onChange={() => togglePreference('autoSendSpotify')}
            className="w-4 h-4 rounded border-black/20 dark:border-white/20 text-accent focus:ring-2 focus:ring-accent/20 cursor-pointer"
          />
          <div className="flex-1">
            <span className={`${TEXT_STYLES.body.base} font-medium block`}>
              Spotify New Releases
            </span>
            <span className={TEXT_STYLES.body.subtle}>
              Auto-email subscribers on new releases
            </span>
          </div>
        </label>
      </div>

      {/* Helper Note */}
      <p className={TEXT_STYLES.body.muted}>
        Note: You can still manually send track announcements from the dashboard regardless of these settings.
      </p>

      {/* Form Actions */}
      <SettingsFormActions
        isSaving={saving}
        showSuccess={successMessage !== null}
        type="submit"
      />
    </form>
  );
}
