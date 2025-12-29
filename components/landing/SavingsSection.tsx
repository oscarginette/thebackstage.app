"use client";

import SavingsCalculator from "./SavingsCalculator";
import { useTranslations } from '@/lib/i18n/context';

export default function SavingsSection() {
  const t = useTranslations('savings');
  return (
    <section id="savings" className="py-16 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
            {t('title.line1')} <br />
            <span className="italic text-accent">{t('title.line2')}</span>
          </h2>
          <p className="text-lg text-foreground/60">
            {t('subtitle')}
          </p>
        </div>

        <SavingsCalculator />
        
        <div className="mt-16 text-center">
             <div className="inline-flex items-center gap-8 py-4 px-8 rounded-full border border-border/50 bg-white/50 backdrop-blur-sm shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-foreground/30">{t('replaces')}</span>
                <div className="flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
                    <span className="font-bold tracking-tighter">Hypeddit</span>
                    <span className="font-bold tracking-tighter">Make</span>
                    <span className="font-bold tracking-tighter">Brevo</span>
                    <span className="font-bold tracking-tighter">Mailchimp</span>
                </div>
             </div>
        </div>
      </div>
    </section>
  );
}
