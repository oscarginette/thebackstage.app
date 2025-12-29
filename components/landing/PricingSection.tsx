"use client";

import { Check, X, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from '@/lib/i18n/context';

export default function PricingSection() {
  const t = useTranslations('pricing');
  const [isAnnual, setIsAnnual] = useState(true);

  // Manual Validation Strategy:
  // - 4 Tiers
  // - Unlimited Gates for everyone
  // - Focus on Contacts/Emails limits
  // - Manual payment upgrade flow (Simulated via Free Signup)

  // Prices (optimized for better savings narrative)
  const prices = {
    free: 0,
    pro: 9.99,
    business: 19.99,  // Reduced from 29.99
    unlimited: 39.99  // Reduced from 49.99
  };

  const calculatePrice = (basePrice: number) => {
    if (basePrice === 0) return "€0";
    if (isAnnual) {
      // 20% discount applied
      const discounted = basePrice * 0.8;
      return `€${discounted.toFixed(2)}`; 
    }
    return `€${basePrice}`;
  };

  const plans = [
    {
      id: "free",
      nameKey: "free.name",
      descriptionKey: "free.description",
      price: calculatePrice(prices.free),
      basePrice: prices.free,
      periodKey: "free.period",
      ctaKey: "free.cta",
      highlight: true,
      features: [
        { nameKey: "free.features.contacts", included: true },
        { nameKey: "free.features.emails", included: true },
        { nameKey: "free.features.smartGates", included: true, highlight: true },
        { nameKey: "free.features.basicAnalytics", included: true },
        { nameKey: "free.features.prioritySupport", included: false },
      ],
    },
    {
      id: "pro",
      nameKey: "pro.name",
      descriptionKey: "pro.description",
      price: calculatePrice(prices.pro),
      basePrice: prices.pro,
      periodKey: "pro.period",
      ctaKey: "pro.cta",
      highlight: false,
      features: [
        { nameKey: "pro.features.contacts", included: true },
        { nameKey: "pro.features.emails", included: true },
        { nameKey: "pro.features.smartGates", included: true, highlight: true },
        { nameKey: "pro.features.advancedInsights", included: true },
        { nameKey: "pro.features.prioritySupport", included: true },
      ],
    },
    {
      id: "business",
      nameKey: "business.name",
      descriptionKey: "business.description",
      price: calculatePrice(prices.business),
      basePrice: prices.business,
      periodKey: "business.period",
      ctaKey: "business.cta",
      highlight: false,
      bigLeagues: true,
      features: [
        { nameKey: "business.features.contacts", included: true },
        { nameKey: "business.features.emails", included: true },
        { nameKey: "business.features.smartGates", included: true, highlight: true },
        { nameKey: "business.features.advancedInsights", included: true },
        { nameKey: "business.features.prioritySupport", included: true },
      ],
    },
    {
      id: "unlimited",
      nameKey: "unlimited.name",
      descriptionKey: "unlimited.description",
      price: calculatePrice(prices.unlimited),
      basePrice: prices.unlimited,
      periodKey: "unlimited.period",
      ctaKey: "unlimited.cta",
      highlight: false,
      bigLeagues: true,
      features: [
        { nameKey: "unlimited.features.contacts", included: true },
        { nameKey: "unlimited.features.emails", included: true },
        { nameKey: "unlimited.features.smartGates", included: true, highlight: true },
        { nameKey: "unlimited.features.advancedInsights", included: true },
        { nameKey: "unlimited.features.dedicatedManager", included: true },
      ],
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/40 transition-colors duration-500">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-serif mb-6">
            {t('title.line1')} <br />
            <span className="italic text-accent">{t('title.line2')}</span> {t('title.line3')}
          </h2>
          <p className="text-xl text-foreground/60 mb-10">
            {t('allInclude')} <strong>{t('unlimitedGates')}</strong>.
            {t('payAsGrow')}
          </p>

          {/* Toggle with logic */}
          <div className="inline-flex items-center p-1 bg-white rounded-full border border-border">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual ? "bg-foreground text-background shadow-md" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isAnnual ? "bg-foreground text-background shadow-md" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {t('annual')} <span className="text-[10px] ml-1 opacity-80">({t('save')})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-[2rem] border transition-all duration-300 bg-background/50 border-border hover:border-foreground/20 hover:shadow-lg ${
                plan.highlight
                  ? "scale-[1.02] md:scale-105 z-10"
                  : ""
              }`}
            >
              {plan.bigLeagues && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-full text-[10px] font-bold text-amber-800 uppercase tracking-wide w-fit">
                    <Trophy className="w-3 h-3 text-amber-700" />
                    {t('bigLeagues')}
                  </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-serif mb-2">{t(plan.nameKey)}</h3>
                <p className="text-foreground/60 text-xs min-h-[40px]">{t(plan.descriptionKey)}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-foreground/40 text-sm font-medium">{t(plan.periodKey)}</span>
                </div>
                {isAnnual && plan.basePrice > 0 && (
                  <p className="text-xs text-foreground/40 mt-2">
                    €{(plan.basePrice * 0.8 * 12).toFixed(2)}{t('perYear')}
                  </p>
                )}
              </div>

              <div className="flex-grow space-y-4 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">{t('includes')}</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className={`w-4 h-4 flex-shrink-0 ${feature.highlight ? "text-foreground" : "text-foreground"}`} />
                      ) : (
                        <X className="w-4 h-4 flex-shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={`${feature.included ? "text-foreground/80" : "text-muted-foreground/40"} ${feature.highlight ? "font-semibold text-foreground" : ""}`}>
                        {t(feature.nameKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/auth/signup"
                className={`w-full flex h-10 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  plan.highlight
                    ? "bg-foreground text-background hover:bg-foreground/90 shadow-xl"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {t(plan.ctaKey)}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
            <p className="text-foreground/40 text-sm">
              {t('enterprise.text')} <a href="mailto:contact@backstage.app" className="underline hover:text-foreground">{t('enterprise.link')}</a> {t('enterprise.for')}
            </p>
        </div>
      </div>
    </section>
  );
}
