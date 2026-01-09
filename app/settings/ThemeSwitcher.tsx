'use client';

import { useTheme } from '@/infrastructure/theme/ThemeProvider';
import { THEMES, Theme } from '@/domain/types/appearance';
import { THEME_TOGGLE_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeSwitcher Component
 *
 * Modern UI component for switching themes.
 * Inspired by Geist Design System's theme switcher.
 * Updates both client-side (cookie/localStorage) and server-side (database).
 *
 * Clean Architecture:
 * - Presentation layer (UI only)
 * - Single responsibility (SRP)
 * - Uses ThemeProvider context for state management
 * - Uses centralized design tokens (DRY + SOLID)
 *
 * USAGE:
 * ```tsx
 * <ThemeSwitcher />
 * ```
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = async (newTheme: Theme) => {
    // Update client-side immediately (optimistic UI)
    setTheme(newTheme);

    // Persist to database (fire-and-forget)
    try {
      await fetch('/api/user/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Note: Client-side theme still works (cookie/localStorage)
    }
  };

  const themes: Array<{
    value: Theme;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      value: THEMES.LIGHT,
      label: 'Light',
      icon: <Sun className="w-4 h-4" />,
      description: 'Light appearance'
    },
    {
      value: THEMES.DARK,
      label: 'Dark',
      icon: <Moon className="w-4 h-4" />,
      description: 'Dark appearance'
    },
    {
      value: THEMES.SYSTEM,
      label: 'System',
      icon: <Monitor className="w-4 h-4" />,
      description: 'Sync with system'
    },
  ];

  return (
    <div className="space-y-3">
      {/* Compact toggle group - Using design tokens */}
      <div className={THEME_TOGGLE_STYLES.container}>
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={cn(
              THEME_TOGGLE_STYLES.button,
              theme === value ? THEME_TOGGLE_STYLES.active : THEME_TOGGLE_STYLES.inactive
            )}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={theme === value}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <p className={TEXT_STYLES.body.muted}>
        Choose your preferred color scheme for the interface
      </p>
    </div>
  );
}
