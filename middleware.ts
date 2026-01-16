/**
 * Next.js Middleware - Subdomain Routing & Route Protection
 *
 * HYBRID PATTERN (SaaS Best Practice):
 * - Marketing + Auth: thebackstage.app (/, /login, /signup, /pricing)
 * - Product: in.thebackstage.app (/dashboard, /settings)
 *
 * Handles:
 * 1. Alias redirect: its.thebackstage.app → in.thebackstage.app
 * 2. Product route redirects: thebackstage.app/dashboard → in.thebackstage.app/dashboard
 * 3. Root auto-redirect for authenticated users
 * 4. Escape hatch with ?public=true query parameter
 * 5. Protected route authentication
 *
 * Routing Logic:
 *
 * thebackstage.app (marketing domain):
 * - /                     - Landing page (or redirect to subdomain if authenticated)
 * - /?public=true         - Landing page (escape hatch, always shows even if authenticated)
 * - /login, /signup       - Auth pages (stay here)
 * - /dashboard, /settings - Redirect to in.thebackstage.app (product lives there)
 *
 * in.thebackstage.app (product domain):
 * - /                     - Redirect to /dashboard (if auth) or thebackstage.app/login (if not)
 * - /dashboard, /settings - Protected routes (require auth)
 *
 * IMPORTANT: This middleware runs in Edge Runtime (not Node.js).
 * We import from auth.config.ts which is Edge-compatible (no DB, no crypto).
 * The full auth logic (with database) is in auth.ts for API routes.
 */

import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;
  const session = req.auth;

  // Get hostname from headers (Vercel passes it via x-forwarded-host or host)
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.hostname;

  // ========================================
  // 1. ALIAS REDIRECT: its.* → in.*
  // ========================================
  if (hostname === 'its.thebackstage.app') {
    const url = req.nextUrl.clone();
    url.hostname = 'in.thebackstage.app';
    return NextResponse.redirect(url);
  }

  // ========================================
  // 2. MAIN DOMAIN ROUTING (thebackstage.app)
  // ========================================
  if (hostname === 'thebackstage.app') {
    // 2a. Redirect /dashboard and /settings to subdomain (product lives there)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
      const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return NextResponse.redirect(new URL(pathname + search, 'https://in.thebackstage.app'));
    }

    // 2b. Redirect authenticated users away from auth pages
    if (session && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', 'https://in.thebackstage.app'));
    }

    // 2c. Root landing page auto-redirect
    if (pathname === '/') {
      const viewAsPublic = searchParams.get('public') === 'true';

      if (session && !viewAsPublic) {
        // Authenticated user WITHOUT escape hatch → redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', 'https://in.thebackstage.app'));
      }

      // Unauthenticated user OR with ?public=true → show landing page
      return NextResponse.next();
    }
  }

  // ========================================
  // 3. SUBDOMAIN ROUTING: in.*
  // ========================================
  if (hostname === 'in.thebackstage.app') {
    // Handle root path of product subdomain
    if (pathname === '/') {
      if (session) {
        // Authenticated user → redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        // Unauthenticated user → redirect to login on main domain
        return NextResponse.redirect(new URL('/login', 'https://thebackstage.app'));
      }
    }

    // Dashboard/Settings already protected by NextAuth middleware (see config.matcher below)
    // Only allow authenticated access
    return NextResponse.next();
  }

  // ========================================
  // 4. PROTECTED ROUTES (NextAuth default)
  // ========================================
  // NextAuth automatically redirects to /login if no session
  // for routes in config.matcher
  return NextResponse.next();
});

/**
 * Matcher Configuration
 *
 * Run middleware on:
 * - Root path (for auto-redirect logic)
 * - Auth pages (to redirect if already logged in)
 * - Protected dashboard and settings routes
 */
export const config = {
  matcher: [
    '/', // Intercept root for auto-redirect
    '/login', // Intercept login to redirect if already authenticated
    '/signup', // Intercept signup to redirect if already authenticated
    '/dashboard/:path*', // Protect dashboard
    '/settings/:path*', // Protect settings
  ],
};
