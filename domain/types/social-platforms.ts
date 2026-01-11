/**
 * Social Platform Constants
 *
 * Type-safe constants for social platform integrations.
 * Following project standards (see .claude/CODE_STANDARDS.md).
 *
 * Clean Architecture: Domain types with no external dependencies.
 */

export const SOCIAL_PLATFORMS = {
  SOUNDCLOUD: 'soundcloud' as const,
  SPOTIFY: 'spotify' as const,
  INSTAGRAM: 'instagram' as const,
} as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS];

export const INSTAGRAM_BASE_URL = 'https://www.instagram.com/';

/**
 * Validate Instagram profile URL
 * @param url - Instagram profile URL
 * @returns true if valid
 */
export function isValidInstagramUrl(url: string): boolean {
  if (!url) return false;

  // Accept both instagram.com and www.instagram.com
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
  return instagramRegex.test(url);
}

/**
 * Extract username from Instagram URL
 * @param url - Instagram profile URL
 * @returns Username or null
 */
export function extractInstagramUsername(url: string): string | null {
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?$/);
  return match ? match[1] : null;
}
