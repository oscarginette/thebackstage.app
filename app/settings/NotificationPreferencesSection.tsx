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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
        <p className="text-sm text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control when your subscribers receive emails about new tracks
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* SoundCloud Auto-Send */}
        <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
          <div className="flex-1">
            <label
              htmlFor="autoSendSoundcloud"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              SoundCloud New Tracks
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically email subscribers when you release new tracks on SoundCloud
            </p>
          </div>
          <div className="ml-4">
            <input
              type="checkbox"
              id="autoSendSoundcloud"
              checked={preferences.autoSendSoundcloud}
              onChange={(e) => updatePreference('autoSendSoundcloud', e.target.checked)}
              disabled={saving}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Spotify Auto-Send */}
        <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
          <div className="flex-1">
            <label
              htmlFor="autoSendSpotify"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Spotify New Releases
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically email subscribers when you release new music on Spotify
            </p>
          </div>
          <div className="ml-4">
            <input
              type="checkbox"
              id="autoSendSpotify"
              checked={preferences.autoSendSpotify}
              onChange={(e) => updatePreference('autoSendSpotify', e.target.checked)}
              disabled={saving}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: You can still manually send track announcements from the dashboard regardless of these settings.
      </p>
    </div>
  );
}
