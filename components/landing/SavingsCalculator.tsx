"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function SavingsCalculator() {
  const t = useTranslations('savings.calculator');
  const sliderValues = [
    100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 
    7500, 10000, 12500, 15000, 20000, 30000, 40000, 50000
  ];
  const [sliderIdx, setSliderIdx] = useState(7); // Start at 1000
  const subscribers = sliderValues[sliderIdx];

  const costs = useMemo(() => {
    const hypedditCost = 20;
    
    let makeCost = 0;
    if (subscribers <= 1000) makeCost = 0;
    else if (subscribers <= 10000) makeCost = 9;
    else if (subscribers <= 40000) makeCost = 16;
    else makeCost = 29;

    let brevoCost = 0;
    const monthlyEmails = subscribers * 4;
    if (subscribers <= 300) brevoCost = 0;
    else if (monthlyEmails <= 5000) brevoCost = 9;
    else if (monthlyEmails <= 10000) brevoCost = 17;
    else if (monthlyEmails <= 20000) brevoCost = 25;
    else if (monthlyEmails <= 50000) brevoCost = 35;
    else if (monthlyEmails <= 100000) brevoCost = 65;
    else brevoCost = 99;

    const totalCompetitor = hypedditCost + makeCost + brevoCost;
    const backstageCost = subscribers < 500 ? 0 : 15;

    return {
      hypeddit: hypedditCost,
      make: makeCost,
      brevo: brevoCost,
      totalCompetitor,
      backstage: backstageCost,
      savings: totalCompetitor - backstageCost
    };
  }, [subscribers]);

  const percentage = (sliderIdx / (sliderValues.length - 1)) * 100;

  return (
    <div className="bg-white rounded-[2rem] border border-border/50 shadow-2xl overflow-hidden max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row">
        
        {/* Left Column: Configuration */}
        <div className="flex-[1.2] p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/50">
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-serif mb-6 text-foreground/80">{t('currentAudience')}</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {subscribers >= 50000 ? "50k+" : subscribers.toLocaleString()}
                  </span>
                  <span className="text-foreground/40 font-medium">{t('subscribers')}</span>
                </div>
                
                <div className="relative h-3 bg-muted border border-border/50 rounded-full">
                  <div 
                    className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(45,78,255,0.2)]"
                    style={{ width: `${percentage}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={sliderValues.length - 1}
                    step="1"
                    value={sliderIdx}
                    onChange={(e) => setSliderIdx(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-4 border-foreground rounded-full shadow-lg pointer-events-none transition-all duration-300"
                    style={{ left: `calc(${percentage}% - 16px)` }}
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  <span>100</span>
                  <span>5k</span>
                  <span>50k+</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{t('externalCosts')}</h4>
              <ul className="space-y-3">
                <li className="flex justify-between text-sm py-2 border-b border-border/30">
                  <span className="text-foreground/60">{t('hypeddit')}</span>
                  <span className="font-mono font-bold">${costs.hypeddit}</span>
                </li>
                <li className="flex justify-between text-sm py-2 border-b border-border/30">
                  <span className="text-foreground/60">{t('make')}</span>
                  <span className="font-mono font-bold">${costs.make}</span>
                </li>
                <li className="flex justify-between text-sm py-2">
                  <span className="text-foreground/60">{t('brevo')}</span>
                  <span className="font-mono font-bold">${costs.brevo}</span>
                </li>
              </ul>
              <div className="pt-2 flex justify-between items-center text-foreground/40">
                <span className="text-[10px] font-bold uppercase tracking-widest italic">{t('estimatedTotal')}</span>
                <span className="text-lg font-mono line-through decoration-red-500/30">${costs.totalCompetitor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Savings Summary */}
        <div className="flex-1 p-8 md:p-12 bg-muted/30 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-md">
              {t('yourPlan')}
            </div>

            <div className="space-y-1 mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-foreground">${costs.backstage}</span>
                <span className="text-foreground/40 font-medium">{t('perMonth')}</span>
              </div>
              <p className="text-sm text-foreground/60 font-medium">{t('allIncluded')}</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-white border border-border/50 shadow-xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent/10 transition-colors" />

              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2">{t('annualSavings')}</p>
              <p className="text-5xl md:text-6xl font-bold text-accent tracking-tighter transition-all group-hover:scale-[1.02] duration-300">
                ${(costs.savings * 12).toLocaleString()}
              </p>
              <div className="pt-4 mt-4 border-t border-border/30 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">{t('monthlySavings')}</span>
                 <span className="text-xl font-serif italic text-foreground/40 font-bold">${costs.savings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <Link
              href="/login"
              className="group w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-foreground text-background font-bold text-lg transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-xl"
            >
              {t('startSaving')}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-[10px] text-center text-foreground/30 leading-relaxed px-4">
              {t('disclaimer', { subscribers: subscribers.toLocaleString() })}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
