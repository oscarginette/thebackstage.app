/**
 * DEBUG ENDPOINT - Remove before production
 * GET /api/debug/soundcloud-config
 *
 * Shows SoundCloud OAuth configuration (sanitized)
 */

import { NextResponse } from 'next/server';
import { env, getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const redirectUri = env.SOUNDCLOUD_REDIRECT_URI || `${getAppUrl()}/api/auth/soundcloud/callback`;

  return NextResponse.json({
    configured: Boolean(env.SOUNDCLOUD_CLIENT_ID && env.SOUNDCLOUD_CLIENT_SECRET),
    clientId: env.SOUNDCLOUD_CLIENT_ID ?
      env.SOUNDCLOUD_CLIENT_ID.substring(0, 10) + '...' + env.SOUNDCLOUD_CLIENT_ID.substring(env.SOUNDCLOUD_CLIENT_ID.length - 4) :
      'NOT SET',
    clientSecret: env.SOUNDCLOUD_CLIENT_SECRET ? '***SET***' : 'NOT SET',
    redirectUri: redirectUri,
    expectedRedirectUri: `${getAppUrl()}/api/auth/soundcloud/callback`,
    appUrl: getAppUrl(),
    authUrl: 'https://secure.soundcloud.com/authorize',
    tokenUrl: 'https://secure.soundcloud.com/oauth/token',
    scope: 'none (using SoundCloud defaults)',
  });
}
