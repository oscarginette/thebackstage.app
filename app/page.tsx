"use client";

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useTranslations } from '@/lib/i18n/context';
import { PATHS } from '@/lib/paths';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingHero from "@/components/landing/LandingHero";
import ProblemSection from "@/components/landing/ProblemSection";
import ProductShowcase from "@/components/landing/ProductShowcase";
import ValuePropSection from "@/components/landing/ValuePropSection";
import FeatureSection from "@/components/landing/FeatureSection";
import PricingSection from "@/components/landing/PricingSection";
import SavingsSection from "@/components/landing/SavingsSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  const t = useTranslations('nav');
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen selection:bg-accent/30 selection:text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={PATHS.HOME} className="font-serif italic text-2xl text-foreground">
            {t('brand')}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#product" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              {t('product')}
            </Link>
            <Link href="#why" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              {t('whyBackstage')}
            </Link>
            <Link href="#features" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              {t('features')}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              {t('pricing')}
            </Link>
            <LanguageSwitcher />
            <Link
              href={session ? PATHS.DASHBOARD.ROOT : PATHS.LOGIN}
              className="h-10 px-6 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
            >
              {session ? t('dashboard') : t('getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <LandingHero />
        <ProblemSection />
        <div id="product" />
        <ProductShowcase />
        <div id="why" />
        <ValuePropSection />
        <div id="features" />
        <FeatureSection />
        <div id="pricing" />
        <PricingSection />
        <SavingsSection />
      </main>

      <LandingFooter />
    </div>
  );
}
