/**
 * Design Tokens
 *
 * Centralized design system values following Clean Architecture.
 * Single source of truth for colors, opacity, borders, shadows, etc.
 *
 * SOLID Principles:
 * - Single Responsibility: Each constant group has one purpose
 * - Open/Closed: Easy to extend without modifying existing values
 * - Dependency Inversion: Components depend on these abstractions
 *
 * Usage:
 * ```tsx
 * import { CARD_STYLES, INPUT_STYLES } from '@/domain/types/design-tokens';
 *
 * <div className={CARD_STYLES.base}>
 *   <input className={INPUT_STYLES.base} />
 * </div>
 * ```
 */

/**
 * Card & Container Styles
 * Used for cards, sections, and container elements
 */
export const CARD_STYLES = {
  // Base card style
  base: 'backdrop-blur-md rounded-2xl shadow-sm',

  // Background variations
  background: {
    default: 'bg-white/90 dark:bg-[#0A0A0A]',
    solid: 'bg-white dark:bg-[#0A0A0A]',
    subtle: 'bg-white/60 dark:bg-[#0A0A0A]/60',
  },

  // Border variations
  border: {
    default: 'border border-black/5 dark:border-white/10',
    subtle: 'border border-black/[0.03] dark:border-white/5',
    strong: 'border border-black/10 dark:border-white/15',
  },

  // Padding variations
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    compact: 'p-3', // For no-scroll layouts
  },

  // Height constraints (for stat cards, etc.)
  height: {
    auto: 'h-auto',
    compact: 'h-auto', // Removes fixed heights, lets content dictate
  },
} as const;

/**
 * Input & Form Element Styles
 * Used for text inputs, textareas, selects
 */
export const INPUT_STYLES = {
  // Base input style
  base: 'w-full h-10 px-4 rounded-xl transition-all text-sm font-medium',

  // Background & border
  appearance: 'border border-black/10 dark:border-white/10 bg-white dark:bg-[#111]',

  // Focus states
  focus: 'focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161616]',

  // Focus colors (brand-specific)
  focusColors: {
    primary: 'focus:ring-accent/20 focus:border-accent/40',
    soundcloud: 'focus:ring-[#FF5500]/20 focus:border-[#FF5500]/40',
    spotify: 'focus:ring-[#1DB954]/20 focus:border-[#1DB954]/40',
    brevo: 'focus:ring-[#0B996E]/20 focus:border-[#0B996E]/40',
  },

  // Text colors
  text: 'text-foreground placeholder:text-foreground/30',

  // Disabled state
  disabled: 'bg-black/[0.02] dark:bg-[#111] border-black/10 dark:border-white/5 text-foreground/40 cursor-not-allowed select-none',
} as const;

/**
 * Button Styles
 * Used for buttons, action triggers
 */
export const BUTTON_STYLES = {
  // Base button
  base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all font-medium active:scale-95',

  // Size variations
  size: {
    xs: 'h-8 px-3 text-xs',
    sm: 'h-9 px-4 text-xs',
    md: 'h-10 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  },

  // Variants
  variant: {
    // Primary action (brand color)
    primary: 'bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] shadow-md',

    // Secondary action (subtle)
    secondary: 'border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-foreground/60 hover:text-foreground hover:border-black/20 hover:bg-white dark:hover:bg-white/10',

    // Danger action
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',

    // Ghost (no background)
    ghost: 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
  },
} as const;

/**
 * Theme Toggle Styles
 * Specific to theme switcher component
 */
export const THEME_TOGGLE_STYLES = {
  // Container
  container: 'inline-flex items-center rounded-lg border border-border/60 dark:border-white/10 bg-white/50 dark:bg-black/20 p-1 backdrop-blur-sm',

  // Button base
  button: 'group relative inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',

  // Button states
  active: 'bg-foreground text-background shadow-sm',
  inactive: 'text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
} as const;

/**
 * Typography Styles
 * Text styles for headings, body, labels
 *
 * IMPORTANT: Always use these constants for text styling.
 * This ensures consistent typography across the entire app.
 */
export const TEXT_STYLES = {
  // Headings
  heading: {
    // Page titles (e.g., Settings pages)
    h1: 'text-2xl font-serif text-foreground',

    // Section titles (e.g., within SettingsSection)
    h2: 'text-base font-serif text-foreground',

    // Sub-section titles
    h3: 'text-sm font-serif text-foreground',
  },

  // Body text
  body: {
    // Regular body text
    base: 'text-sm text-foreground',

    // Subtle/secondary text (descriptions, helper text)
    subtle: 'text-xs text-foreground/60',

    // Very small text (character counts, hints)
    muted: 'text-[10px] text-foreground/40',
  },

  // Labels
  label: {
    // Default form labels
    default: 'text-sm font-medium text-foreground',

    // Small uppercase labels (Settings pages)
    small: 'text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40',
  },
} as const;

/**
 * Layout Styles
 * Container, spacing, layout patterns
 */
export const LAYOUT_STYLES = {
  // Container widths
  container: {
    sm: 'max-w-3xl mx-auto',
    md: 'max-w-5xl mx-auto',
    lg: 'max-w-7xl mx-auto',
  },

  // Spacing (vertical rhythm)
  spacing: {
    // Section spacing (between major sections)
    section: 'space-y-5',      // Default: 1.25rem (20px)
    sectionCompact: 'space-y-4', // Compact: 1rem (16px) - for no-scroll layouts

    // Stack spacing (between related items)
    stack: 'space-y-2',        // Default: 0.5rem (8px)
    stackTight: 'space-y-1',   // Tight: 0.25rem (4px)

    // Inline spacing
    inline: 'flex gap-2',
    inlineCompact: 'flex gap-1.5',
  },

  // Sidebar dimensions (Golden Ratio: 1:1.618)
  sidebar: {
    width: 'w-[200px]',        // 200px sidebar for ~1:6 ratio with main content
    widthSettings: 'w-64',     // 256px for settings (16rem)
  },

  // Page wrapper
  page: 'min-h-screen h-screen relative flex flex-col bg-background selection:bg-accent/30 selection:text-foreground overflow-hidden',

  // Page content (no scroll optimization)
  pageContent: {
    // Standard padding
    padding: 'px-6 lg:px-8 pt-6 pb-12',
    // Compact padding (for no-scroll layouts)
    paddingCompact: 'px-6 lg:px-8 pt-4 pb-8',
  },
} as const;

/**
 * Dashboard Component Styles
 * Specific to dashboard sidebar and navigation
 */
export const DASHBOARD_STYLES = {
  // Sidebar
  sidebar: {
    // Container
    container: 'h-screen sticky top-0 border-r border-border/40 bg-background/80 backdrop-blur-md flex flex-col z-50',

    // Header (brand section)
    header: 'p-4 pb-2',
    headerTitle: 'text-xl font-serif tracking-tight text-foreground leading-[0.9]',
    headerSubtitle: 'text-[10px] text-muted-foreground font-light mt-0.5',

    // Navigation
    nav: 'flex-1 px-3 py-4 space-y-0.5 overflow-y-auto',
    navItem: 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative',
    navItemActive: 'bg-foreground text-background shadow-md',
    navItemInactive: 'text-muted-foreground hover:bg-accent/5 hover:text-foreground',
    navIcon: 'w-4 h-4 transition-colors',

    // Footer
    footer: 'p-3 space-y-3',
    footerDivider: 'border-t border-border/40',
  },

  // Tables
  table: {
    // Container
    wrapper: 'overflow-x-auto',
    container: 'min-w-full',

    // Row heights (compact for no-scroll)
    rowCompact: 'h-10',  // Reduced from default ~12-14
    rowDefault: 'h-12',

    // Cell padding
    cellPaddingCompact: 'px-3 py-2',
    cellPaddingDefault: 'px-4 py-3',
  },
} as const;

/**
 * Animation & Transition Styles
 */
export const ANIMATION_STYLES = {
  // Aurora effects
  aurora: {
    light: 'bg-aurora-light dark:bg-aurora-dark opacity-40 dark:opacity-20 blur-[120px] animate-blob',
    position: 'absolute -top-20 -left-20 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-normal filter pointer-events-none',
  },

  // Fade in animations (Framer Motion)
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
} as const;

/**
 * Utility function to combine styles
 *
 * Usage:
 * ```tsx
 * import { cn } from '@/lib/utils';
 * import { CARD_STYLES, INPUT_STYLES } from '@/domain/types/design-tokens';
 *
 * <div className={cn(CARD_STYLES.base, CARD_STYLES.background.default, CARD_STYLES.padding.md)}>
 *   <input className={cn(INPUT_STYLES.base, INPUT_STYLES.appearance, INPUT_STYLES.focus, INPUT_STYLES.text)} />
 * </div>
 * ```
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
