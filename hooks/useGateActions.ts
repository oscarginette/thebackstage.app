/**
 * useGateActions Hook
 *
 * Provides all action handlers for gate flow.
 * Uses utility functions from lib/gate-actions.ts
 *
 * Single Responsibility: Action handlers orchestration
 */

import { useState } from 'react';
import { EmailSubmitData, DownloadSubmission } from '@/domain/types/download-gate-ui';
import {
  submitEmailToGate,
  redirectToSoundCloudOAuth,
  redirectToSpotifyOAuth,
  trackInstagramClick,
  generateDownloadToken,
} from '@/lib/gate-actions';

interface UseGateActionsProps {
  slug: string;
  gateId: string | undefined;
  submission: DownloadSubmission | null;
  onSubmissionUpdate: (submission: DownloadSubmission) => void;
  onSubmissionPartialUpdate: (updates: Partial<DownloadSubmission>) => void;
}

interface UseGateActionsResult {
  handleEmailSubmit: (data: EmailSubmitData) => Promise<void>;
  handleSoundcloudActions: (commentText?: string) => Promise<void>;
  handleSpotify: (autoSaveOptIn: boolean) => Promise<void>;
  handleInstagramClick: () => Promise<void>;
  handleDownload: () => Promise<void>;
  oauthLoading: boolean;
  instagramLoading: boolean;
}

/**
 * Gate action handlers with loading states
 *
 * @param props - Configuration and callbacks
 * @returns Action handlers and loading states
 */
export function useGateActions({
  slug,
  gateId,
  submission,
  onSubmissionUpdate,
  onSubmissionPartialUpdate,
}: UseGateActionsProps): UseGateActionsResult {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);

  const handleEmailSubmit = async (data: EmailSubmitData) => {
    const result = await submitEmailToGate(slug, data);

    const newSubmission: DownloadSubmission = {
      submissionId: result.submissionId,
      email: data.email,
      soundcloudRepostVerified: false,
      soundcloudFollowVerified: false,
      spotifyConnected: false,
      instagramClickTracked: false,
      downloadCompleted: false,
    };

    onSubmissionUpdate(newSubmission);
  };

  const handleSoundcloudActions = async (commentText?: string) => {
    if (!submission?.submissionId || !gateId) return;

    setOauthLoading(true);
    redirectToSoundCloudOAuth(submission.submissionId, gateId, commentText);
  };

  const handleSpotify = async (autoSaveOptIn: boolean) => {
    if (!submission?.submissionId || !gateId) return;

    setOauthLoading(true);
    redirectToSpotifyOAuth(submission.submissionId, gateId, autoSaveOptIn);
  };

  const handleInstagramClick = async () => {
    if (!submission?.submissionId || !gateId) return;

    setInstagramLoading(true);

    try {
      const data = await trackInstagramClick(submission.submissionId, gateId);

      if (data.success && data.instagramUrl) {
        onSubmissionPartialUpdate({
          instagramClickTracked: true,
          instagramClickTrackedAt: new Date(),
        });

        window.open(data.instagramUrl, '_blank');
      } else {
        console.error('Failed to track Instagram click:', data.error);
      }
    } catch (error) {
      console.error('Instagram click error:', error);
    } finally {
      setInstagramLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!submission?.submissionId) return;

    try {
      const { token } = await generateDownloadToken(slug, submission.submissionId);

      // Open download in new tab
      window.open(`/api/download/${token}`, '_blank');

      // Mark download as completed
      onSubmissionPartialUpdate({ downloadCompleted: true });

      // Redirect current page to success page (which auto-redirects to home after 10s)
      setTimeout(() => {
        window.location.href = '/download-success';
      }, 500); // Small delay to ensure download starts
    } catch (error) {
      console.error('Error generating download token:', error);
    }
  };

  return {
    handleEmailSubmit,
    handleSoundcloudActions,
    handleSpotify,
    handleInstagramClick,
    handleDownload,
    oauthLoading,
    instagramLoading,
  };
}
