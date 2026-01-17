/**
 * Download Gate Step Utilities
 *
 * Functions for configuring and filtering progress steps.
 * Business logic for step visibility and completion state.
 *
 * Clean Architecture: Domain utilities
 */

import { GATE_STEPS } from '@/domain/types/download-gate-steps';
import { DownloadGate, DownloadSubmission, ProgressStep } from '@/domain/types/download-gate-ui';

/**
 * Build progress steps array filtered by gate requirements
 *
 * Only includes steps that are required by the gate configuration.
 * Marks steps as completed based on submission state.
 *
 * @param gate - Gate configuration (can be null during loading)
 * @param submission - Current submission state (can be null before email submission)
 * @param currentStep - Currently active step ID
 * @returns Array of progress steps to display
 */
export function buildProgressSteps(
  gate: DownloadGate | null,
  submission: DownloadSubmission | null,
  currentStep: string
): ProgressStep[] {
  const allSteps: ProgressStep[] = [
    {
      id: GATE_STEPS.EMAIL,
      label: 'Email',
      completed: !!submission,
      current: currentStep === GATE_STEPS.EMAIL,
    },
    {
      id: GATE_STEPS.SOUNDCLOUD,
      label: 'Support',
      completed: submission?.soundcloudRepostVerified ?? false,
      current: currentStep === GATE_STEPS.SOUNDCLOUD,
    },
    {
      id: GATE_STEPS.INSTAGRAM,
      label: 'Instagram',
      completed: submission?.instagramClickTracked ?? false,
      current: currentStep === GATE_STEPS.INSTAGRAM,
    },
    {
      id: GATE_STEPS.SPOTIFY,
      label: 'Spotify',
      completed: submission?.spotifyConnected ?? false,
      current: currentStep === GATE_STEPS.SPOTIFY,
    },
    {
      id: GATE_STEPS.DOWNLOAD,
      label: 'Download',
      completed: submission?.downloadCompleted ?? false,
      current: currentStep === GATE_STEPS.DOWNLOAD,
    },
  ];

  // Filter steps based on gate requirements
  return allSteps.filter((step) => {
    if (step.id === GATE_STEPS.SOUNDCLOUD) {
      return gate?.requireSoundcloudRepost || gate?.requireSoundcloudFollow;
    }
    if (step.id === GATE_STEPS.INSTAGRAM) {
      return gate?.requireInstagramFollow;
    }
    if (step.id === GATE_STEPS.SPOTIFY) {
      return gate?.requireSpotifyConnect;
    }
    // Email and Download steps are always included
    return true;
  });
}
