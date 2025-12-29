"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/messages/en.json';
import es from '@/messages/es.json';

type Locale = 'en' | 'es';

type Messages = any;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = { en, es };

// Helper function to get nested property
function getNestedProperty(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Cookie utilities
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'es' ? 'es' : 'en';
}

export function I18nProvider({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  // Use initialLocale from server if provided, otherwise detect
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on client side, once
    if (typeof window !== 'undefined' && !isInitialized) {
      // Priority: 1) Cookie, 2) initialLocale, 3) Browser detection
      const cookieLocale = getCookie('NEXT_LOCALE') as Locale | null;

      if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'es')) {
        setLocaleState(cookieLocale);
      } else if (!initialLocale) {
        // No cookie and no server-provided locale, detect from browser
        const detected = detectBrowserLocale();
        setLocaleState(detected);
        setCookie('NEXT_LOCALE', detected);
      }

      setIsInitialized(true);
    }
  }, [isInitialized, initialLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setCookie('NEXT_LOCALE', newLocale);

    // Also update html lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getNestedProperty(messages[locale], key);

    // Replace placeholders like {subscribers} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslations must be used within I18nProvider');
  }

  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return context.t(fullKey, params);
  };
}

export function useLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useLocale must be used within I18nProvider');
  }

  return context.locale;
}

export function useSetLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useSetLocale must be used within I18nProvider');
  }

  return context.setLocale;
}
