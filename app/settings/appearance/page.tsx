'use client';

import { ThemeSwitcher } from '../ThemeSwitcher';

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-foreground mb-2">Appearance</h2>
        <p className="text-foreground/50 text-sm">Customize how Backstage looks on your device</p>
      </div>

      <section className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-2xl">
        <ThemeSwitcher />
      </section>
    </div>
  );
}
