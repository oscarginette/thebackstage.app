"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/lib/i18n/context";

interface SettingsClientProps {
  userName: string;
  userEmail: string;
}

export default function SettingsClient({ userName: initialName, userEmail }: SettingsClientProps) {
  const t = useTranslations("settings");

  const [name, setName] = useState(initialName);
  const [soundcloudId, setSoundcloudId] = useState("");
  const [spotifyId, setSpotifyId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen h-screen relative flex flex-col bg-[#FDFCF8] selection:bg-accent/30 selection:text-foreground overflow-hidden">
      {/* Background Aurora Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-aurora-light opacity-30 blur-[120px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-accent/5 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header Navigation */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm font-bold text-foreground/40 hover:text-foreground transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center bg-white/40 backdrop-blur-md group-hover:border-accent group-hover:bg-accent/5 transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="hidden sm:inline uppercase tracking-widest text-[9px]">{t("back")}</span>
        </Link>

        <div className="font-serif italic text-xl text-foreground/80">
          Backstage Settings
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
          <div className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif text-foreground">
                  {name || userEmail.split('@')[0]}
                </h2>
                <p className="text-xs text-foreground/50 font-medium">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Section: Personal Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl p-6 shadow-sm"
            >
              <div className="mb-5">
                <h2 className="text-base font-serif mb-1">{t("personalInfo")}</h2>
                <p className="text-foreground/50 text-xs">{t("personalSubtitle")}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 focus:bg-white transition-all text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                    {t("email")}
                  </label>
                  <div className="w-full h-10 px-4 rounded-xl border border-border/40 bg-black/5 flex items-center text-foreground/30 text-sm font-medium cursor-not-allowed select-none">
                    {userEmail}
                  </div>
                  <p className="text-[8px] text-foreground/30 ml-1 italic">Cannot be modified</p>
                </div>
              </div>
            </motion.section>

            {/* Section: Platform Connections */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl p-6 shadow-sm"
            >
              <div className="mb-5">
                <h2 className="text-base font-serif mb-1">{t("platforms")}</h2>
                <p className="text-foreground/50 text-xs">{t("platformsSubtitle")}</p>
              </div>

              <div className="space-y-4">
                {/* SoundCloud ID */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                    {t("soundcloud")}
                  </label>
                  <input
                    type="text"
                    value={soundcloudId}
                    onChange={(e) => setSoundcloudId(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]/40 focus:bg-white transition-all text-sm font-medium placeholder:text-foreground/20"
                    placeholder="oscarginette"
                  />
                </div>

                {/* Spotify ID */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                    {t("spotify")}
                  </label>
                  <input
                    type="text"
                    value={spotifyId}
                    onChange={(e) => setSpotifyId(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 focus:border-[#1DB954]/40 focus:bg-white transition-all text-sm font-medium placeholder:text-foreground/20"
                    placeholder="123456789"
                  />
                </div>
              </div>
            </motion.section>
          </div>

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
                  className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {t("saved")}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
