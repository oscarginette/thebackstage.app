/**
 * Download Gate Actions Utilities
 *
 * Reusable functions for gate-related API calls and OAuth flows.
 * These are pure functions that can be easily tested.
 *
 * Clean Architecture: Infrastructure utilities
 */

import { EmailSubmitData } from '@/domain/types/download-gate-ui';

/**
 * Submit email to gate and create submission
 *
 * @throws Error if submission fails
 */
export async function submitEmailToGate(
  slug: string,
  data: EmailSubmitData
): Promise<{ submissionId: string }> {
  const response = await fetch(`/api/gate/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      consentMarketing: data.consentMarketing,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Internal server error' }));
    throw new Error(errorData.error || 'Failed to submit email. Please try again.');
  }

  return response.json();
}

/**
 * Redirect to SoundCloud OAuth flow
 * This will navigate the browser to the SoundCloud authorization page
 */
export function redirectToSoundCloudOAuth(
  submissionId: string,
  gateId: string,
  commentText?: string
): void {
  const params = new URLSearchParams({
    submissionId,
    gateId,
  });

  if (commentText && commentText.trim().length > 0) {
    params.append('comment', encodeURIComponent(commentText.trim()));
  }

  window.location.href = `/api/auth/soundcloud?${params.toString()}`;
}

/**
 * Redirect to Spotify OAuth flow
 * This will navigate the browser to the Spotify authorization page
 */
export function redirectToSpotifyOAuth(
  submissionId: string,
  gateId: string,
  autoSaveOptIn: boolean
): void {
  const redirectUrl = `/api/auth/spotify?submissionId=${submissionId}&gateId=${gateId}&autoSaveOptIn=${autoSaveOptIn}`;
  window.location.href = redirectUrl;
}

/**
 * Track Instagram click and get profile URL
 *
 * @returns Promise with success status and Instagram URL
 */
export async function trackInstagramClick(
  submissionId: string,
  gateId: string
): Promise<{ success: boolean; instagramUrl?: string; error?: string }> {
  const res = await fetch(
    `/api/instagram/track?submissionId=${submissionId}&gateId=${gateId}`
  );

  return res.json();
}

/**
 * Generate download token for file access
 *
 * @throws Error if token generation fails
 */
export async function generateDownloadToken(
  slug: string,
  submissionId: string
): Promise<{ token: string }> {
  const tokenResponse = await fetch(`/api/gate/${slug}/download-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to generate download token');
  }

  return tokenResponse.json();
}
