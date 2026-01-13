'use client';

import React from 'react';
import { LayoutDashboard, Rocket, Mail, Users, Shield, Settings, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { LAYOUT_STYLES, DASHBOARD_STYLES } from '@/domain/types/design-tokens';

export type TabType = 'overview' | 'growth' | 'engagement' | 'audience' | 'admin';

interface DashboardSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardSidebar({ activeTab, onTabChange, isAdmin = false, user }: DashboardSidebarProps) {
  const tNav = useTranslations('nav');

  const mainNavItems: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'growth', label: 'Download Gates', icon: Rocket },
    { id: 'engagement', label: 'Emails & Newsletters', icon: Mail },
    { id: 'audience', label: 'Audience', icon: Users },
  ];

  if (isAdmin) {
    mainNavItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <aside className={cn(LAYOUT_STYLES.sidebar.width, DASHBOARD_STYLES.sidebar.container)}>
      {/* 1. Brand Header */}
      <div className={DASHBOARD_STYLES.sidebar.header}>
        <h1 className={DASHBOARD_STYLES.sidebar.headerTitle}>
            The Backstage
        </h1>
        <p className={DASHBOARD_STYLES.sidebar.headerSubtitle}>
            The Artist's Command Center
        </p>
      </div>

      {/* 2. Navigation Items */}
      <nav className={DASHBOARD_STYLES.sidebar.nav}>
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                DASHBOARD_STYLES.sidebar.navItem,
                isActive
                  ? DASHBOARD_STYLES.sidebar.navItemActive
                  : DASHBOARD_STYLES.sidebar.navItemInactive
              )}
            >
              <item.icon className={cn(
                DASHBOARD_STYLES.sidebar.navIcon,
                isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}

              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-background/50 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Settings & User Footer */}
      <div className={DASHBOARD_STYLES.sidebar.footer}>
        {/* Settings Link (moved above divider) */}
        <Link href="/settings" className={cn(DASHBOARD_STYLES.sidebar.navItem, DASHBOARD_STYLES.sidebar.navItemInactive)}>
            <Settings className={DASHBOARD_STYLES.sidebar.navIcon} />
            Settings
        </Link>

        {/* Divider */}
        <div className={DASHBOARD_STYLES.sidebar.footerDivider} />

        {/* User Card */}
        {user && (
            <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/10 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between px-1 pt-1">
             <Link href="/" target="_blank" className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Visit Website
             </Link>
             <div className="text-[10px] text-muted-foreground/40">v1.2.0</div>
        </div>
      </div>
    </aside>
  );
}
