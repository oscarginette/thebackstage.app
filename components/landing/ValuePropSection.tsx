"use client";

import { Mail, Users, TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function ValuePropSection() {
  const t = useTranslations('valueProp');
  return (
    <section className="py-24 border-y border-border">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
            {t('title.line1')} <br />
            {t('title.line2')} <span className="text-accent italic">{t('title.line3')}</span>.
          </h2>
          <p className="text-xl text-foreground/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Reach */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">{t('directReach.title')}</h3>
            <p className="text-foreground/60 leading-relaxed font-sans">
              {t('directReach.description')}
            </p>
          </div>

          {/* Card 2: Ownership */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">{t('totalOwnership.title')}</h3>
            <p className="text-foreground/60 leading-relaxed">
              {t('totalOwnership.description')}
            </p>
          </div>

          {/* Card 3: Conversion */}
          <div className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4">{t('trueCommunity.title')}</h3>
            <p className="text-foreground/60 leading-relaxed">
              {t('trueCommunity.description')}
            </p>
          </div>
        </div>
        
        {/* Comparison Graphic */}
        <div className="mt-16 p-8 md:p-12 rounded-[2rem] bg-foreground text-background overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-3xl font-serif mb-4">{t('engagement.title')}</h4>
              <p className="text-background/60 text-lg">
                {t('engagement.description')}
              </p>
            </div>
            <div className="flex justify-around items-end gap-4 h-32">
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-accent/20 h-8 rounded-t-lg transition-all hover:h-12" />
                <span className="text-xs font-medium">{t('engagement.socialReach')}</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-accent h-32 rounded-t-lg shadow-[0_0_20px_rgba(255,85,0,0.5)]" />
                <span className="text-xs font-medium">{t('engagement.emailOpenRate')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
