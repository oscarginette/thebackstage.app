"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/context";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PATHS } from '@/lib/paths';

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || PATHS.DASHBOARD.ROOT;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in with NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(t('invalidCredentials') || 'Invalid email or password');
          setIsLoading(false);
          return;
        }

        // Success - redirect to dashboard
        router.push(callbackUrl);
        router.refresh();
        // Note: Don't reset loading state here - component will unmount after redirect
      } else {
        // Signup with API
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            passwordConfirm: password,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Signup failed');
          setIsLoading(false);
          return;
        }

        // Auto-login after signup
        try {
          const loginResult = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });

          if (loginResult?.error) {
            console.warn('Auto-login failed after signup:', loginResult.error);
            setError('Account created! Please login.');
            setIsLogin(true);
            setIsLoading(false);
            return;
          }

          // Success - redirect to dashboard
          router.push(callbackUrl);
          router.refresh();
          // Note: Don't reset loading state here - component will unmount after redirect
        } catch (loginError) {
          console.error('Auto-login error after signup:', loginError);
          setError('Account created! Please login.');
          setIsLogin(true);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 selection:bg-accent/30 selection:text-foreground overflow-hidden">
      {/* Background Aurora Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
        <div className="bg-aurora-light w-full h-full opacity-30" />
      </div>

      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-blob" />

      {/* Back to Home */}
      <Link
        href={PATHS.HOME}
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-all group"
      >
        <div className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center bg-white/50 backdrop-blur-sm group-hover:border-accent group-hover:bg-accent/5 transition-all">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        </div>
        {t("back")}
      </Link>

      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <Link href={PATHS.HOME} className="font-serif italic text-4xl text-foreground mb-8 inline-block hover:opacity-80 transition-opacity text-center w-full">
            The Backstage
          </Link>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login-header" : "signup-header"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 text-balance">
                {isLogin ? t("title") : t("signup_title")}
              </h1>
              <p className="text-foreground/60 font-sans text-lg">
                {isLogin ? t("subtitle") : t("signup_subtitle")}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden ring-1 ring-black/5">
          {/* Subtle top light effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground/70 ml-1">
                      {t("name")}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 focus:bg-white transition-all text-base placeholder:text-foreground/30"
                      placeholder="John Doe"
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-foreground/70 ml-1">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 focus:bg-white transition-all text-base placeholder:text-foreground/30"
                placeholder="hello@artist.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-semibold text-foreground/70">
                  {t("password")}
                </label>
                {isLogin && (
                  <button type="button" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
                    {t("forgotPassword")}
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 focus:bg-white transition-all text-base placeholder:text-foreground/30"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background text-lg font-semibold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-lg shadow-foreground/10 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-background/20 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? t("submit") : t("signup_submit")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border/50 text-center relative z-10">
            <p className="text-sm text-foreground/50 font-medium">
              {isLogin ? t("noAccount") : t("haveAccount")}{" "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-accent font-bold hover:text-accent/80 transition-colors"
              >
                {isLogin ? t("signup") : t("signin")}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer minimal info */}
      <div className="mt-12 text-foreground/30 text-xs font-medium uppercase tracking-widest">
        &copy; 2025 The Backstage
      </div>
    </div>
  );
}
