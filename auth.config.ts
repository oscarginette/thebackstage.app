/**
 * Auth Config - Edge Runtime Compatible
 *
 * This is a MINIMAL auth configuration that can run in Edge Runtime.
 * Used by middleware.ts to verify JWT tokens.
 *
 * NO DATABASE ACCESS - NO NODE.JS MODULES - EDGE COMPATIBLE
 *
 * The full auth configuration (with database, bcrypt, etc) is in auth.ts
 * and is used by API routes which run in Node.js runtime.
 */

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Leading dot allows sharing across subdomains
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnSettings = nextUrl.pathname.startsWith('/settings');

      // Redirect to login if not authenticated
      if ((isOnDashboard || isOnSettings) && !isLoggedIn) {
        return false; // This will redirect to pages.signIn
      }

      return true; // Allow access
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
