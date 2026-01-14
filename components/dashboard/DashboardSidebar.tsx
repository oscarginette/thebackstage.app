'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Rocket, Mail, Users, Shield, Settings, LogOut, ExternalLink, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { LAYOUT_STYLES, DASHBOARD_STYLES } from '@/domain/types/design-tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';

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
  const tSettings = useTranslations('settings');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mainNavItems: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'growth', label: 'Download Gates', icon: Rocket },
    { id: 'engagement', label: 'Emails & Newsletters', icon: Mail },
    { id: 'audience', label: 'Audience', icon: Users },
  ];

  if (isAdmin) {
    mainNavItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

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

        {/* User Card with Dropdown */}
        {user && (
            <div ref={menuRef} className="relative">
                <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full p-2.5 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent/10 hover:border-accent/20 flex items-center gap-2.5 transition-all duration-200 group"
                >
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[13px] font-bold text-accent">
                        {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{user.name || user.email?.split('@')[0]}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.role}</p>
                    </div>
                    <ChevronUp
                        className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isUserMenuOpen ? "rotate-180" : ""
                        )}
                    />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isUserMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border/40 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                            <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2.5 flex items-center gap-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-200"
                            >
                                <LogOut className="w-4 h-4" />
                                {tSettings('logout')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}

        <div className="flex items-center justify-between px-1 pt-1">
             <Link href="/" target="_blank" className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Visit Website
             </Link>
             <div className="text-[11px] text-muted-foreground/40">v1.2.0</div>
        </div>
      </div>
    </aside>
  );
}
