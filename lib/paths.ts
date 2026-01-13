/**
 * Centralized path configuration for the application
 *
 * This ensures type-safety and prevents broken links throughout the app.
 * All internal navigation should use these constants instead of hardcoded strings.
 *
 * Usage:
 * ```tsx
 * import { PATHS } from '@/lib/paths';
 *
 * <Link href={PATHS.LOGIN}>Login</Link>
 * <Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}>Create Gate</Link>
 *
 * router.push(PATHS.DASHBOARD.ROOT);
 * ```
 */

export const PATHS = {
  // Public pages
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PRICING: '/pricing',
  UPGRADE: '/upgrade',

  // Auth & Settings
  SETTINGS: '/settings',
  SETTINGS_EMAIL_SIGNATURE: '/settings/email-signature',
  SETTINGS_SENDING_DOMAINS: '/settings/sending-domains',
  UNSUBSCRIBE: '/unsubscribe',

  // Dashboard
  DASHBOARD: {
    ROOT: '/dashboard',
    TEMPLATES: {
      ROOT: '/dashboard/templates',
      NEW: '/dashboard/templates/new',
      EDIT: (id: string) => `/dashboard/templates/${id}`,
    },
    DOWNLOAD_GATES: {
      ROOT: '/dashboard/download-gates',
      NEW: '/dashboard/download-gates/new',
      DETAILS: (id: string) => `/dashboard/download-gates/${id}`,
    },
  },

  // Admin
  ADMIN: {
    ROOT: '/admin',
  },

  // Public gates
  GATE: {
    VIEW: (slug: string) => `/gate/${slug}`,
  },

  // Stats
  STATS: '/stats',

  // API routes (for reference, but typically used server-side)
  API: {
    AUTH: {
      SIGNIN: '/api/auth/signin',
      SIGNUP: '/api/auth/signup',
      SOUNDCLOUD: '/api/auth/soundcloud',
      SOUNDCLOUD_CALLBACK: '/api/auth/soundcloud/callback',
      SPOTIFY: '/api/auth/spotify',
      SPOTIFY_CALLBACK: '/api/auth/spotify/callback',
    },
    CONTACTS: {
      ROOT: '/api/contacts',
      DELETE: '/api/contacts/delete',
      IMPORT: {
        PARSE: '/api/contacts/import/parse',
        EXECUTE: '/api/contacts/import/execute',
      },
    },
    DOWNLOAD_GATES: {
      ROOT: '/api/download-gates',
      DETAILS: (id: string) => `/api/download-gates/${id}`,
      STATS: (id: string) => `/api/download-gates/${id}/stats`,
      SUBMISSIONS: (id: string) => `/api/download-gates/${id}/submissions`,
    },
    TEMPLATES: {
      ROOT: '/api/templates',
      DETAILS: (id: string) => `/api/templates/${id}`,
      COMPILE: '/api/templates/compile',
      RENDER: '/api/templates/render',
    },
    GATE: {
      INFO: (slug: string) => `/api/gate/${slug}`,
      SUBMIT: (slug: string) => `/api/gate/${slug}/submit`,
      DOWNLOAD_TOKEN: (slug: string) => `/api/gate/${slug}/download-token`,
      ANALYTICS: '/api/gate/analytics',
    },
    CAMPAIGNS: {
      ROOT: '/api/campaigns',
      DETAILS: (id: string) => `/api/campaigns/${id}`,
      STATS: '/api/campaign-stats',
    },
    INTEGRATIONS: {
      BREVO: {
        STATUS: '/api/integrations/brevo/status',
        CONNECT: '/api/integrations/brevo/connect',
        DISCONNECT: '/api/integrations/brevo/disconnect',
        IMPORT: '/api/integrations/brevo/import',
        IMPORT_EXECUTE: '/api/integrations/brevo/import/execute',
        PREVIEW: '/api/integrations/brevo/preview',
      },
    },
    USER: {
      SETTINGS: '/api/user/settings',
      QUOTA: '/api/user/quota',
    },
    ADMIN: {
      PROMOTE_USER: '/api/admin/promote-user',
    },
    QUOTA: '/api/quota',
    UNSUBSCRIBE: '/api/unsubscribe',
    RESUBSCRIBE: '/api/resubscribe',
  },
} as const;

/**
 * Helper to build URLs with query parameters
 *
 * @example
 * buildUrl(PATHS.LOGIN, { redirect: '/dashboard' })
 * // Returns: '/login?redirect=%2Fdashboard'
 */
export function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `${path}?${queryString}`;
}

/**
 * Type-safe path builder for dynamic routes
 * Ensures that all required parameters are provided
 */
export type PathBuilder = typeof PATHS;
