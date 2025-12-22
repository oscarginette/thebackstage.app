"use client";

import { CheckCircle2, Zap, Palette, BarChart3 } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function FeatureSection() {
  const t = useTranslations('features');

  const features = [
    {
      titleKey: "smartGate.title",
      descriptionKey: "smartGate.description",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      titleKey: "autoNewsletter.title",
      descriptionKey: "autoNewsletter.description",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      titleKey: "analytics.title",
      descriptionKey: "analytics.description",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      titleKey: "zeroEffort.title",
      descriptionKey: "zeroEffort.description",
      icon: <CheckCircle2 className="w-5 h-5" />,
    }
  ];

  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3 sticky top-24">
            <h2 className="text-5xl font-serif mb-6 leading-tight">
              {t('title.line1')} <br />
              <span className="italic text-accent underline decoration-accent/20">{t('title.line2')}</span> {t('title.line3')}
            </h2>
            <p className="text-foreground/60 text-lg mb-8">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="md:w-2/3 grid sm:grid-cols-2 gap-x-12 gap-y-16">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-accent bg-white shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-serif leading-none">{t(feature.titleKey)}</h3>
                <p className="text-foreground/60 leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
