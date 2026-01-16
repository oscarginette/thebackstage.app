/**
 * Next.js Middleware - Subdomain Routing & Route Protection
 *
 * Handles:
 * 1. Alias redirect: its.thebackstage.app → in.thebackstage.app
 * 2. Root landing page auto-redirect for authenticated users
 * 3. Escape hatch with ?public=true query parameter
 * 4. Subdomain detection and routing
 * 5. Protected route authentication
 *
 * Protected routes (in.thebackstage.app):
 * - /dashboard/*
 * - /settings/*
 *
 * Public routes:
 * - thebackstage.app/ (landing page - or /dashboard if authenticated)
 * - /login
 * - /register
 * - /unsubscribe
 * - /api/* (API routes handle their own auth)
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
  const { pathname, searchParams, hostname } = req.nextUrl;
  const session = req.auth;

  // ========================================
  // 1. ALIAS REDIRECT: its.* → in.*
  // ========================================
  if (hostname === 'its.thebackstage.app') {
    const url = req.nextUrl.clone();
    url.hostname = 'in.thebackstage.app';
    return NextResponse.redirect(url);
  }

  // ========================================
  // 2. ROOT LANDING PAGE AUTO-REDIRECT
  // ========================================
  if (hostname === 'thebackstage.app' && pathname === '/') {
    const viewAsPublic = searchParams.get('public') === 'true';

    if (session && !viewAsPublic) {
      // Authenticated user WITHOUT escape hatch → redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', 'https://in.thebackstage.app'));
    }

    // Unauthenticated user OR with ?public=true → show landing page
    return NextResponse.next();
  }

  // ========================================
  // 3. SUBDOMAIN ROUTING: in.*
  // ========================================
  if (hostname === 'in.thebackstage.app') {
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
 * - Protected dashboard and settings routes
 */
export const config = {
  matcher: [
    '/', // Intercept root for auto-redirect
    '/dashboard/:path*', // Protect dashboard
    '/settings/:path*', // Protect settings
  ],
};
