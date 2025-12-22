"use client";

import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function LandingFooter() {
  const t = useTranslations('footer');
  return (
    <footer className="py-20 bg-[#F2F0E9]/50 border-t border-border">
      <div className="container px-4 mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-serif mb-8 max-w-2xl mx-auto">
          {t('title.line1')} <span className="italic">{t('title.line2')}</span>{t('title.line3')}
        </h2>

        <Link
          href="/login"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-10 text-lg font-medium text-background transition-all hover:scale-105 active:scale-95 mb-12 shadow-xl hover:shadow-2xl"
        >
          {t('cta')}
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-border/50 text-foreground/40 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-lg text-foreground/80">{t('brand')}</span>
            <span>{t('copyright')}</span>
          </div>

          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">{t('privacy')}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t('terms')}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t('contact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
