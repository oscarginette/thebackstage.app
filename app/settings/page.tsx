"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, User, Music, Mail, CheckCircle2, Cloud, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/lib/i18n/context";

export default function SettingsPage() {
  const t = useTranslations("settings");
  
  const [name, setName] = useState("Oscar Ginette");
  const [email] = useState("oscar@example.com");
  const [soundcloudId, setSoundcloudId] = useState("oscarginette");
  const [spotifyId, setSpotifyId] = useState("123456789");
  
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
    <div className="min-h-screen relative flex flex-col bg-[#FDFCF8] selection:bg-accent/30 selection:text-foreground overflow-x-hidden">
      {/* Background Aurora Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-aurora-light opacity-30 blur-[120px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-accent/5 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header Navigation */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-3 text-sm font-bold text-foreground/40 hover:text-foreground transition-all"
        >
          <div className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center bg-white/40 backdrop-blur-md group-hover:border-accent group-hover:bg-accent/5 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{t("back")}</span>
        </Link>

        <div className="font-serif italic text-2xl text-foreground/80">
          Backstage Settings
        </div>

        <div className="w-10 h-10" /> {/* Spacer for symmetry */}
      </nav>

      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-24">
        {/* Page Header */}
        <header className="mb-12 text-center sm:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-serif tracking-tight mb-4"
          >
            {t("title")}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-foreground/50 font-sans"
          >
            {t("subtitle")}
          </motion.p>
        </header>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section: Personal Information */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-serif">{t("personalInfo")}</h2>
                <p className="text-foreground/50 text-sm">{t("personalSubtitle")}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
                  {t("fullName")}
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent/40 focus:bg-white transition-all text-base font-medium"
                    placeholder="John Doe"
                  />
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
                  {t("email")}
                </label>
                <div className="relative group">
                  <div className="w-full h-14 px-5 rounded-2xl border border-border/40 bg-black/5 flex items-center text-foreground/30 font-medium cursor-not-allowed select-none">
                    {email}
                    <Mail className="w-4 h-4 ml-auto opacity-20" />
                  </div>
                </div>
                <p className="text-[9px] text-foreground/30 ml-1 italic italic">Account email cannot be modified yet.</p>
              </div>
            </div>
          </motion.section>

          {/* Section: Platform Connections */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-[#1c1c1c]/5 text-[#1c1c1c] flex items-center justify-center border border-black/5">
                <Music className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-serif">{t("platforms")}</h2>
                <p className="text-foreground/50 text-sm">{t("platformsSubtitle")}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-10">
              {/* SoundCloud ID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 font-black">
                    {t("soundcloud")}
                  </label>
                  <Cloud className="w-3 h-3 text-[#FF3300]" />
                </div>
                <input 
                  type="text" 
                  value={soundcloudId}
                  onChange={(e) => setSoundcloudId(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-[#FF3300]/40 focus:bg-white transition-all text-base font-medium placeholder:text-foreground/20"
                  placeholder="oscarginette"
                />
              </div>

              {/* Spotify ID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 font-black">
                    {t("spotify")}
                  </label>
                  <div className="w-3 h-3 rounded-full bg-[#1DB954] flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full opacity-50" />
                  </div>
                </div>
                <input 
                  type="text" 
                  value={spotifyId}
                  onChange={(e) => setSpotifyId(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-[#1DB954]/40 focus:bg-white transition-all text-base font-medium placeholder:text-foreground/20"
                  placeholder="123456789"
                />
              </div>
            </div>
            
          </motion.section>

          {/* Footer Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-6 pt-6"
          >
            <button
              type="submit"
              disabled={isSaving}
              className="group relative w-full sm:w-auto h-12 px-8 rounded-xl bg-foreground text-background text-sm font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-lg shadow-foreground/10 disabled:opacity-70 overflow-hidden"
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
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
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
                    <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
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
                  className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t("saved")}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </form>
      </main>

      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 text-center text-foreground/20 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2025 Backstage Automation &bull; Artist First Platform
      </footer>
    </div>
  );
}
