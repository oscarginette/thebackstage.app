/**
 * Social Profile URL Utilities
 *
 * Provides URL normalization and validation for social platforms.
 * Follows Single Responsibility Principle (SRP) - only URL handling logic.
 *
 * Usage:
 * - normalizeSocialUrl('thebackstage', 'instagram') → 'https://instagram.com/thebackstage'
 * - normalizeSocialUrl('soundcloud.com/thebackstage', 'soundcloud') → 'https://soundcloud.com/thebackstage'
 */

export type SocialPlatform = 'instagram' | 'soundcloud' | 'spotify';

interface PlatformConfig {
  baseUrl: string;
  urlPattern: RegExp;
  extractUsername: (url: string) => string | null;
}

const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    baseUrl: 'https://instagram.com',
    urlPattern: /instagram\.com\/([^/?]+)/,
    extractUsername: (url: string) => {
      const match = url.match(/instagram\.com\/([^/?]+)/);
      return match ? match[1] : null;
    },
  },
  soundcloud: {
    baseUrl: 'https://soundcloud.com',
    urlPattern: /soundcloud\.com\/([^/?]+)/,
    extractUsername: (url: string) => {
      const match = url.match(/soundcloud\.com\/([^/?]+)/);
      return match ? match[1] : null;
    },
  },
  spotify: {
    baseUrl: 'https://open.spotify.com/artist',
    urlPattern: /open\.spotify\.com\/artist\/([^/?]+)/,
    extractUsername: (url: string) => {
      const match = url.match(/open\.spotify\.com\/artist\/([^/?]+)/);
      return match ? match[1] : null;
    },
  },
};

/**
 * Normalizes social profile URL to full HTTPS format
 *
 * Accepts:
 * - Full URL: https://instagram.com/thebackstage
 * - Domain URL: instagram.com/thebackstage
 * - Username: thebackstage
 * - Username with @: @thebackstage
 *
 * @param input - User input (URL, username, or handle)
 * @param platform - Social platform (instagram, soundcloud, spotify)
 * @returns Normalized full URL or null if invalid
 */
export function normalizeSocialUrl(
  input: string,
  platform: SocialPlatform
): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    return null;
  }

  let normalizedUrl = input.trim();

  // Remove leading @ if present
  if (normalizedUrl.startsWith('@')) {
    normalizedUrl = normalizedUrl.slice(1);
  }

  // Case 1: Full URL with https://
  if (normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }

  // Case 2: Full URL with http:// (upgrade to https)
  if (normalizedUrl.startsWith('http://')) {
    return normalizedUrl.replace('http://', 'https://');
  }

  // Case 3: Domain without protocol (e.g., "instagram.com/thebackstage")
  if (normalizedUrl.includes('.com/')) {
    return `https://${normalizedUrl}`;
  }

  // Case 4: Just username (e.g., "thebackstage")
  // Construct full URL based on platform
  if (platform === 'spotify') {
    // Spotify requires artist ID, not username - don't auto-construct
    return null;
  }

  return `${config.baseUrl}/${normalizedUrl}`;
}

/**
 * Extracts username/handle from social profile URL
 *
 * @param url - Full or partial social profile URL
 * @param platform - Social platform
 * @returns Username/handle or null if extraction fails
 */
export function extractSocialUsername(
  url: string,
  platform: SocialPlatform
): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    return null;
  }

  // Normalize first
  const normalizedUrl = normalizeSocialUrl(url, platform);
  if (!normalizedUrl) {
    return null;
  }

  // Extract username using platform-specific pattern
  return config.extractUsername(normalizedUrl);
}

/**
 * Validates social profile URL format
 *
 * @param url - Social profile URL to validate
 * @param platform - Social platform
 * @returns true if URL format is valid for the platform
 */
export function isValidSocialUrl(
  url: string,
  platform: SocialPlatform
): boolean {
  const normalized = normalizeSocialUrl(url, platform);
  if (!normalized) {
    return false;
  }

  const config = PLATFORM_CONFIGS[platform];
  return config.urlPattern.test(normalized);
}

/**
 * Gets placeholder text for social platform input
 *
 * @param platform - Social platform
 * @returns Placeholder text with example URL
 */
export function getSocialPlaceholder(platform: SocialPlatform): string {
  switch (platform) {
    case 'instagram':
      return 'https://instagram.com/yourusername';
    case 'soundcloud':
      return 'https://soundcloud.com/yourusername';
    case 'spotify':
      return 'https://open.spotify.com/artist/...';
    default:
      return '';
  }
}

/**
 * Gets helper text for social platform input
 *
 * @param platform - Social platform
 * @returns Helper text explaining what to enter
 */
export function getSocialHelperText(platform: SocialPlatform): string {
  switch (platform) {
    case 'instagram':
      return 'Enter your Instagram handle or URL';
    case 'soundcloud':
      return 'Paste your SoundCloud profile URL';
    case 'spotify':
      return 'Paste your Spotify artist URL';
    default:
      return '';
  }
}
