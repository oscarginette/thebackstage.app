import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/soundcloud/extract-id
 * Extracts SoundCloud user ID from profile URL
 *
 * Accepts either:
 * - Full URL: https://soundcloud.com/username
 * - Username: username
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL: add https:// if missing
    let normalizedUrl = url.trim();
    if (normalizedUrl.startsWith('soundcloud.com')) {
      normalizedUrl = `https://${normalizedUrl}`;
    } else if (!normalizedUrl.startsWith('http')) {
      // If it's just a username, construct the URL
      normalizedUrl = `https://soundcloud.com/${normalizedUrl}`;
    }

    // Extract username from URL
    let username = normalizedUrl;
    if (username.includes('soundcloud.com/')) {
      const match = username.match(/soundcloud\.com\/([^/?]+)/);
      if (!match) {
        return NextResponse.json(
          { error: 'Invalid SoundCloud URL format' },
          { status: 400 }
        );
      }
      username = match[1];
    }

    // Remove leading @ if present
    username = username.replace(/^@/, '');

    console.log('[SoundCloud Extract] Fetching profile for username:', username);

    // Fetch the SoundCloud profile page
    const profileUrl = `https://soundcloud.com/${username}`;
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Backstage/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'SoundCloud profile not found' },
        { status: 404 }
      );
    }

    const html = await response.text();

    // Extract user ID from the HTML
    // Pattern: soundcloud://users:1318247880
    const match = html.match(/soundcloud:\/\/users:(\d+)/);

    if (!match) {
      console.error('[SoundCloud Extract] Could not find user ID in HTML');
      return NextResponse.json(
        { error: 'Could not extract user ID from profile' },
        { status: 404 }
      );
    }

    const userId = match[1];
    console.log('[SoundCloud Extract] Extracted user ID:', userId);

    return NextResponse.json({
      userId,           // Numeric ID (e.g., "1318247880")
      username,         // Username/permalink (e.g., "geebeatmusic")
      permalink: username, // Alias for clarity
      profileUrl,       // Full URL (e.g., "https://soundcloud.com/geebeatmusic")
    });

  } catch (error: unknown) {
    console.error('[SoundCloud Extract] Error:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "Unknown error") || 'Failed to extract SoundCloud ID' },
      { status: 500 }
    );
  }
}
