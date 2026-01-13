/**
 * IntegrationsSettings Component
 *
 * Platform connections form (SoundCloud, Spotify).
 * Refactored to use unified Settings design system components.
 *
 * Architecture:
 * - Uses SettingsSection for card wrapper
 * - Uses Input component for form fields with platform-specific focus colors
 * - Uses SettingsFormActions for save button + success message
 * - Keeps expandable help sections (SoundCloud/Spotify ID instructions)
 *
 * Migration:
 * - Before: 342 lines with duplicated styles
 * - After: ~200 lines using design system (42% reduction)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsSection } from './SettingsSection';
import { SettingsFormActions } from './SettingsFormActions';
import { Input } from '@/components/ui/Input';
import { TEXT_STYLES } from '@/domain/types/design-tokens';

interface IntegrationsSettingsProps {
  initialSoundcloudId: string;
  initialSoundcloudPermalink: string;
  initialSpotifyId: string;
}

export function IntegrationsSettings({
  initialSoundcloudId,
  initialSoundcloudPermalink,
  initialSpotifyId
}: IntegrationsSettingsProps) {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const soundcloudInputRef = useRef<HTMLInputElement>(null);

  // Display permalink if available, otherwise construct URL from numeric ID
  const initialSoundcloudUrl = initialSoundcloudPermalink
    ? `https://soundcloud.com/${initialSoundcloudPermalink}`
    : (initialSoundcloudId ? `https://soundcloud.com/user/${initialSoundcloudId}` : '');

  const [soundcloudUrl, setSoundcloudUrl] = useState(initialSoundcloudUrl);
  const [spotifyUrl, setSpotifyUrl] = useState(initialSpotifyId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSoundCloudHelp, setShowSoundCloudHelp] = useState(false);
  const [showSpotifyHelp, setShowSpotifyHelp] = useState(false);

  // Auto-focus SoundCloud input when coming from dashboard
  useEffect(() => {
    const focusParam = searchParams?.get('focus');
    if (focusParam === 'soundcloud' && soundcloudInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        soundcloudInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams]);

  const returnTo = searchParams?.get('returnTo');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soundcloudUrl: soundcloudUrl.trim() || null,
          spotifyUrl: spotifyUrl.trim() || null
        })
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
    <>
      {returnTo && (
        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors mb-6"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Volver al Dashboard
        </Link>
      )}
      <form onSubmit={handleSave} className="space-y-6">
        <SettingsSection
        title={t("platforms")}
        description={t("platformsSubtitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SoundCloud URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={TEXT_STYLES.label.small}>
                {t("soundcloud")}
              </label>
              <button
                type="button"
                onClick={() => setShowSoundCloudHelp(!showSoundCloudHelp)}
                className="inline-flex items-center gap-1 text-[9px] font-bold text-[#FF5500] hover:text-[#e64d00] transition-colors uppercase tracking-widest"
              >
                <Info className="w-3 h-3" />
                See how
                {showSoundCloudHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <Input
              ref={soundcloudInputRef}
              type="text"
              value={soundcloudUrl}
              onChange={(e) => setSoundcloudUrl(e.target.value)}
              placeholder="https://soundcloud.com/thebackstage"
              helperText="Paste your SoundCloud profile URL"
              focusVariant="soundcloud"
            />
          </div>

          {/* Spotify URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={TEXT_STYLES.label.small}>
                {t("spotify")}
              </label>
              <button
                type="button"
                onClick={() => setShowSpotifyHelp(!showSpotifyHelp)}
                className="inline-flex items-center gap-1 text-[9px] font-bold text-[#1DB954] hover:text-[#1aa34a] transition-colors uppercase tracking-widest"
              >
                <Info className="w-3 h-3" />
                See how
                {showSpotifyHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <Input
              type="text"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              helperText="Paste your Spotify artist URL"
              focusVariant="spotify"
            />
          </div>
        </div>

        {/* SoundCloud Help (Expandable) */}
        <AnimatePresence>
          {showSoundCloudHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-6"
            >
              <div className="bg-gradient-to-br from-[#FF5500]/5 to-[#FF5500]/10 border border-[#FF5500]/20 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#FF5500]" />
                  Cómo obtener tu SoundCloud URL
                </h3>
                <p className={TEXT_STYLES.body.subtle}>
                  Ve a soundcloud.com, abre tu perfil, y copia la URL completa (ej: soundcloud.com/tu-usuario).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spotify Help (Expandable) */}
        <AnimatePresence>
          {showSpotifyHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-6"
            >
              <div className="bg-gradient-to-br from-[#1DB954]/5 to-[#1DB954]/10 border border-[#1DB954]/20 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#1DB954]" />
                  Cómo obtener tu Spotify Artist URL
                </h3>
                <p className={TEXT_STYLES.body.subtle}>
                  Ve a open.spotify.com, busca tu nombre de artista, abre tu perfil, y copia la URL completa.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsSection>

      <SettingsFormActions
        isSaving={isSaving}
        showSuccess={showSuccess}
        type="submit"
      />
    </form>
    </>
  );
}
