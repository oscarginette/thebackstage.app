'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Palette, Bell, Globe, FileSignature, LayoutGrid, Plug, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PATHS } from '@/lib/paths';

const SIDEBAR_ITEMS = [
  {
    category: 'Personal settings',
    items: [
      {
        label: 'Profile & Appearance',
        href: '/settings/profile',
        icon: User,
      },
      {
        label: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    category: 'Organization settings',
    items: [
      {
        label: 'Platform Connections',
        href: '/settings/integrations',
        icon: Plug,
      },
      {
        label: 'Senders & Domains',
        href: '/settings/sending-domains',
        icon: Globe,
      },
      {
        label: 'Email Signature',
        href: '/settings/email-signature',
        icon: FileSignature,
      },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block border-r border-border/40 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        {/* Back to Dashboard Link */}
        <div className="p-6 pb-2">
            <Link 
                href={PATHS.DASHBOARD.ROOT}
                className="group flex items-center gap-2 text-sm font-bold text-foreground/40 hover:text-foreground transition-all mb-8"
            >
                <div className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md group-hover:border-accent group-hover:bg-accent/5 transition-all shadow-sm">
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                </div>
                <span className="uppercase tracking-widest text-[9px]">Back</span>
            </Link>
            <h1 className="text-2xl font-serif text-foreground px-1">Settings</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-8">
          {SIDEBAR_ITEMS.map((section) => (
            <div key={section.category}>
              <h3 className="px-2 mb-2 text-[10px] uppercase tracking-widest font-black text-foreground/30">
                {section.category}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-accent/10 text-accent font-bold'
                            : 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-4 h-4',
                            isActive ? 'text-accent' : 'text-foreground/40'
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
