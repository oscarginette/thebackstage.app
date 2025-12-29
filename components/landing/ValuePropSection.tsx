"use client";

import { Mail, Users, TrendingUp } from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function ValuePropSection() {
  const t = useTranslations('valueProp');
  const [index, setIndex] = useState(0);
  const words = [
    t('flywheel.words.moreGigs'),
    t('flywheel.words.moreFans'),
    t('flywheel.words.moreReach')
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <section className="py-24 border-y border-border overflow-hidden">
      <div className="container px-4 mx-auto">
        
        {/* Flywheel Animation Section */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse" />

          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight whitespace-nowrap">
            {t('flywheel.title')} <span className="text-accent italic">{t('flywheel.titleAccent')}</span>
          </h2>

          <div className="h-20 md:h-32 flex items-center justify-center overflow-hidden mt-2">
            <span className="text-3xl md:text-6xl text-foreground/40 font-serif mr-4">=</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-4xl md:text-7xl font-bold text-foreground"
              >
                {words[index]}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-8 text-lg text-foreground/60 max-w-2xl mx-auto">
            {t('flywheel.subtitle')}
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
        <div className="mt-16 p-8 md:p-12 rounded-[2.5rem] bg-[#1a1a1a] text-white overflow-hidden relative border border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h4 className="text-3xl md:text-4xl font-serif mb-6">{t('engagement.title')}</h4>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                {t('engagement.description')}
              </p>
            </div>
            
            <div className="flex justify-center items-end gap-12 h-64">
              {/* Social Reach Bar */}
              <div className="flex flex-col items-center gap-6 w-48 group">
                <div className="w-full bg-white/10 border border-white/20 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:h-16 group-hover:bg-white/15">
                  <span className="text-lg font-bold text-white/70">3-5%</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 text-center">
                  {t('engagement.socialReach')}
                </span>
              </div>

              {/* Email Open Rate Bar */}
              <div className="flex flex-col items-center gap-6 w-48 group">
                <div className="w-full bg-accent h-48 rounded-2xl flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(255,85,0,0.5)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2">
                  <span className="text-3xl font-black text-white">35%</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent text-center">
                  {t('engagement.emailOpenRate')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
