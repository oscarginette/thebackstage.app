"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2, Info, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/lib/i18n/context";
import { signOut } from "next-auth/react";
import BrevoIntegration from "./BrevoIntegration";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NotificationPreferencesSection } from "./NotificationPreferencesSection";
import { PATHS } from '@/lib/paths';

interface SettingsClientProps {
  userName: string;
  userEmail: string;
  userId: string;
  soundcloudId: string;
  soundcloudPermalink: string;
  spotifyId: string;
}

export default function SettingsClient({
  userName: initialName,
  userEmail,
  userId,
  soundcloudId: initialSoundcloudId,
  soundcloudPermalink: initialSoundcloudPermalink,
  spotifyId: initialSpotifyId
}: SettingsClientProps) {
  const t = useTranslations("settings");

  const [name, setName] = useState(initialName);
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          soundcloudUrl: soundcloudUrl.trim() || null,
          spotifyUrl: spotifyUrl.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Error saving settings:', errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: PATHS.LOGIN });
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen h-screen relative flex flex-col bg-background selection:bg-accent/30 selection:text-foreground overflow-hidden">
      {/* Background Aurora Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-aurora-light dark:bg-aurora-dark opacity-30 dark:opacity-100 blur-[120px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-accent/5 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header Navigation */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex items-center justify-between">
        <Link
          href={PATHS.DASHBOARD.ROOT}
          className="group inline-flex items-center gap-2 text-sm font-bold text-foreground/40 hover:text-foreground transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md group-hover:border-accent group-hover:bg-accent/5 transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="hidden sm:inline uppercase tracking-widest text-[9px]">{t("back")}</span>
        </Link>

        <div className="font-serif italic text-xl text-foreground/80">
          The Backstage Settings
        </div>

        <div className="w-8 h-8" />
      </nav>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex-1 flex flex-col overflow-y-auto">
        {/* User Info Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif text-foreground">
                  {name || userEmail.split('@')[0]}
                </h2>
                <p className="text-xs text-foreground/50 font-medium">
                  {userEmail}
                </p>
              </div>

              {/* Logout Button - Discreet */}
              <button
                type="button"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="group relative h-8 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-foreground/60 hover:text-foreground hover:border-black/20 hover:bg-white dark:hover:bg-white/10 text-xs font-medium transition-all disabled:opacity-70"
              >
                <span className="flex items-center gap-1.5">
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">{t("logout")}</span>
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Section: Personal Information - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-base font-serif mb-1 text-foreground">{t("personalInfo")}</h2>
              <p className="text-foreground/50 text-xs">{t("personalSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                  {t("fullName")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium text-foreground"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                  {t("email")}
                </label>
                <div className="w-full h-10 px-4 rounded-xl border border-black/10 bg-black/[0.02] dark:bg-[#111] dark:border-white/5 flex items-center text-foreground/40 text-sm font-medium cursor-not-allowed select-none">
                  {userEmail}
                </div>
                <p className="text-[8px] text-foreground/30 ml-1 italic">Cannot be modified</p>
              </div>
            </div>
          </motion.section>

          {/* Section: Appearance - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-base font-serif mb-1 text-foreground">Appearance</h2>
              <p className="text-foreground/50 text-xs">Customize how Backstage looks on your device</p>
            </div>

            <ThemeSwitcher />
          </motion.section>

          {/* Section: Email Notifications - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.175 }}
            className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <NotificationPreferencesSection />
          </motion.section>

          {/* Section: Platform Connections - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <div className="mb-5">
              <h2 className="text-base font-serif mb-1 text-foreground">{t("platforms")}</h2>
              <p className="text-foreground/50 text-xs">{t("platformsSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SoundCloud URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
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
                <input
                  type="text"
                  value={soundcloudUrl}
                  onChange={(e) => setSoundcloudUrl(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium placeholder:text-foreground/30 text-foreground"
                  placeholder="https://soundcloud.com/geebeatmusic"
                />
                <p className="text-[10px] text-foreground/40 ml-1">
                  Paste your SoundCloud profile URL
                </p>
              </div>

              {/* Spotify URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
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
                <input
                  type="text"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 focus:border-[#1DB954]/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium placeholder:text-foreground/30 text-foreground"
                  placeholder="https://open.spotify.com/artist/..."
                />
                <p className="text-[10px] text-foreground/40 ml-1">
                  Paste your Spotify artist URL
                </p>
              </div>
            </div>
          </motion.section>

          {/* Brevo Integration Section - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <BrevoIntegration userId={userId} />
          </motion.section>

          {/* Save Button - Right below cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <button
              type="submit"
              disabled={isSaving}
              className="group relative h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md disabled:opacity-70"
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-3 h-3 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                    {t("saving")}
                  </motion.div>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-3 h-3" />
                    {t("save")}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {t("saved")}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SoundCloud ID Help - Instructions */}
          <AnimatePresence>
            {showSoundCloudHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#FF5500]/5 to-[#FF5500]/10 border border-[#FF5500]/20 rounded-2xl p-6 relative z-20 bg-background/95 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#FF5500]" />
                    Cómo obtener tu SoundCloud ID
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Abre tu perfil de SoundCloud</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Ve a <a href="https://soundcloud.com" target="_blank" className="text-[#FF5500] hover:underline font-medium">soundcloud.com</a> e inicia sesión en tu cuenta.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Copia la URL de tu perfil</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Haz clic en tu foto de perfil y copia la URL. Se verá así: <span className="font-mono bg-white dark:bg-black/20 px-1.5 py-0.5 rounded text-[10px]">soundcloud.com/tu-usuario</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Extrae tu ID de usuario</p>
                        <p className="text-xs text-foreground/60 leading-relaxed mb-2">
                          Tu SoundCloud ID es la última parte de la URL (después del último "/"). Por ejemplo:
                        </p>
                        <div className="bg-white dark:bg-black/20 rounded-lg p-3 border border-border/60">
                          <p className="text-[10px] font-mono text-foreground/40 mb-1">URL completa:</p>
                          <p className="text-[11px] font-mono text-foreground mb-2">https://soundcloud.com/<span className="bg-[#FF5500]/20 px-1">gee_beat</span></p>
                          <p className="text-[10px] font-mono text-foreground/40 mb-1">Tu SoundCloud ID:</p>
                          <p className="text-[11px] font-mono font-bold text-[#FF5500]">gee_beat</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Pégalo arriba y guarda</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Copia ese ID y pégalo en el campo "SoundCloud ID" de arriba. Luego haz clic en "Save changes".
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#FF5500]/20">
                    <p className="text-[10px] text-foreground/50 italic">
                      💡 Tip: Si tu URL tiene números al final (ej: /gee_beat-123), incluye todo después del último "/".
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spotify Artist ID Help - Instructions */}
          <AnimatePresence>
            {showSpotifyHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#1DB954]/5 to-[#1DB954]/10 border border-[#1DB954]/20 rounded-2xl p-6 relative z-20 bg-background/95 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#1DB954]" />
                    Cómo obtener tu Spotify Artist ID
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Abre tu perfil de artista en Spotify</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Ve a <a href="https://open.spotify.com" target="_blank" className="text-[#1DB954] hover:underline font-medium">open.spotify.com</a> y busca tu nombre de artista.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-white flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Entra a tu perfil de artista</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Haz clic en tu perfil de artista (no en una canción). La URL se verá así: <span className="font-mono bg-white dark:bg-black/20 px-1.5 py-0.5 rounded text-[10px]">open.spotify.com/artist/...</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-white flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Copia el Artist ID de la URL</p>
                        <p className="text-xs text-foreground/60 leading-relaxed mb-2">
                          Tu Spotify Artist ID está en la URL después de "/artist/". Es un código de 22 caracteres. Por ejemplo:
                        </p>
                        <div className="bg-white dark:bg-black/20 rounded-lg p-3 border border-border/60">
                          <p className="text-[10px] font-mono text-foreground/40 mb-1">URL completa:</p>
                          <p className="text-[11px] font-mono text-foreground mb-2 break-all">https://open.spotify.com/artist/<span className="bg-[#1DB954]/20 px-1">3TVXtAsR1Inumwj472S9r4</span></p>
                          <p className="text-[10px] font-mono text-foreground/40 mb-1">Tu Spotify Artist ID:</p>
                          <p className="text-[11px] font-mono font-bold text-[#1DB954]">3TVXtAsR1Inumwj472S9r4</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1DB954] text-white flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground mb-1">Pégalo arriba y guarda</p>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                          Copia ese ID de 22 caracteres y pégalo en el campo "Spotify Artist ID" de arriba. Luego haz clic en "Save changes".
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#1DB954]/20">
                    <p className="text-[10px] text-foreground/50 italic">
                      💡 Tip: También puedes hacer clic en los 3 puntos (...) de tu perfil → Compartir → Copiar enlace del artista.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={handleCancelLogout}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-sm mx-4 border border-white/80 dark:border-white/10"
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {t("confirmLogout")}
                </h3>
                <p className="text-sm text-foreground/60 mb-6">
                  {t("confirmLogoutMessage")}
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancelLogout}
                    disabled={isLoggingOut}
                    className="h-10 px-6 rounded-lg border border-border/60 text-foreground text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-70"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLogout}
                    disabled={isLoggingOut}
                    className="h-10 px-6 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-70"
                  >
                    {isLoggingOut ? "Signing out..." : t("signOut")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
