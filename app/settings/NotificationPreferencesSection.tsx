'use client';

import { useState, useEffect } from 'react';

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

  const updatePreference = async (field: keyof NotificationPreferences, value: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preference');
      }

      const data = await response.json();
      setPreferences({
        autoSendSoundcloud: data.autoSendSoundcloud,
        autoSendSpotify: data.autoSendSpotify,
      });

      setSuccessMessage('Preferences updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-serif text-foreground">Email Notifications</h2>
        <p className="text-xs text-foreground/50">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-serif mb-1 text-foreground">Email Notifications</h2>
        <p className="text-foreground/50 text-xs">
          Control when subscribers receive emails about new tracks
        </p>
      </div>

      {/* Error/Success Messages - Compact */}
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <p className="text-xs text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Notification Options - Compact List */}
      <div className="space-y-3">
        {/* SoundCloud Auto-Send */}
        <div className="flex items-center justify-between py-2.5 px-3 border border-black/5 dark:border-white/10 rounded-xl bg-white/50 dark:bg-[#0A0A0A]/50 hover:bg-white/80 dark:hover:bg-[#0A0A0A]/80 transition-colors">
          <label
            htmlFor="autoSendSoundcloud"
            className="flex-1 cursor-pointer"
          >
            <span className="text-sm font-medium text-foreground block">SoundCloud New Tracks</span>
            <span className="text-[10px] text-foreground/40 block mt-0.5">
              Auto-email subscribers on new releases
            </span>
          </label>
          <input
            type="checkbox"
            id="autoSendSoundcloud"
            checked={preferences.autoSendSoundcloud}
            onChange={(e) => updatePreference('autoSendSoundcloud', e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-3 flex-shrink-0"
          />
        </div>

        {/* Spotify Auto-Send */}
        <div className="flex items-center justify-between py-2.5 px-3 border border-black/5 dark:border-white/10 rounded-xl bg-white/50 dark:bg-[#0A0A0A]/50 hover:bg-white/80 dark:hover:bg-[#0A0A0A]/80 transition-colors">
          <label
            htmlFor="autoSendSpotify"
            className="flex-1 cursor-pointer"
          >
            <span className="text-sm font-medium text-foreground block">Spotify New Releases</span>
            <span className="text-[10px] text-foreground/40 block mt-0.5">
              Auto-email subscribers on new releases
            </span>
          </label>
          <input
            type="checkbox"
            id="autoSendSpotify"
            checked={preferences.autoSendSpotify}
            onChange={(e) => updatePreference('autoSendSpotify', e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-3 flex-shrink-0"
          />
        </div>
      </div>

      {/* Helper Note - Compact */}
      <p className="text-[10px] text-foreground/40">
        Note: You can still manually send track announcements from the dashboard regardless of these settings.
      </p>
    </div>
  );
}
