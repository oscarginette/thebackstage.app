/**
 * DEBUG ENDPOINT - TEMPORARY
 * Helps diagnose authentication issues in production
 *
 * DELETE THIS FILE after debugging is complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Get all cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map(c => c.trim());

    // Find NextAuth cookie
    const authCookie = cookies.find(c =>
      c.startsWith('authjs.session-token=') ||
      c.startsWith('next-auth.session-token=')
    );

    return NextResponse.json({
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
        cookieHeader: cookieHeader.substring(0, 100) + '...', // First 100 chars
        authCookieExists: !!authCookie,
        authCookiePrefix: authCookie?.substring(0, 30),
        allCookieNames: cookies.map(c => c.split('=')[0]),
        hostname: request.headers.get('x-forwarded-host') || request.headers.get('host'),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          hasAuthSecret: !!process.env.AUTH_SECRET,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          cookieDomain: process.env.NEXTAUTH_COOKIE_DOMAIN || 'undefined',
        }
      },
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        }
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
