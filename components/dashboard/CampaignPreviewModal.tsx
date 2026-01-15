'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { formatCampaignDate } from '@/lib/date-utils';
import CampaignMetadata from '@/components/dashboard/shared/CampaignMetadata';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import EmailPreview from '@/components/ui/EmailPreview';

interface CampaignPreviewModalProps {
  executionLogId: number;
  onClose: () => void;
}

interface CampaignPreviewData {
  id: string;
  templateId?: string | null;
  trackId?: string | null;
  subject: string;
  htmlContent: string;
  sentAt: string;
  emailsSent: number;
  // NOTE: senderEmail and senderName are populated from user settings by GetCampaignPreviewUseCase
  // These represent the sender that was configured when this campaign was sent (historical data)
  // They are NOT stored per-campaign - they come from users.sender_email / users.sender_name
  // Per-campaign sender selection is forbidden (see .claude/CLAUDE.md)
  senderEmail?: string | null;
  senderName?: string | null;
  metadata: {
    greeting?: string;
    message?: string;
    signature?: string;
    coverImageUrl?: string;
    trackTitle?: string;
    trackUrl?: string;
  };
}

/**
 * CampaignPreviewModal
 *
 * Read-only modal for previewing historical campaigns.
 * Displays campaign HTML content and metadata safely using an iframe.
 */
export default function CampaignPreviewModal({
  executionLogId,
  onClose,
}: CampaignPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignPreviewData | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCampaignPreview();
  }, [executionLogId]);

  const fetchCampaignPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/execution-history/${executionLogId}/preview`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch campaign preview');
      }

      const data = await response.json();

      // Handle nested data structure: { success: true, data: { campaign: {...} } }
      const campaign = data.data?.campaign || data.campaign;

      if (campaign) {
        setCampaign(campaign);
      } else {
        throw new Error('No campaign data received');
      }
    } catch (err) {
      console.error('Error fetching campaign preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign preview');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!campaign) return;

    setCreatingDraft(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: campaign.templateId || undefined,
          trackId: campaign.trackId || undefined,
          subject: campaign.subject,
          greeting: campaign.metadata?.greeting || '',
          message: campaign.metadata?.message || '',
          signature: campaign.metadata?.signature || '',
          coverImageUrl: campaign.metadata?.coverImageUrl || null,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create draft');
      }

      const data = await response.json();

      if (data.success && data.data?.campaign?.id) {
        // Close preview modal
        onClose();
        // Navigate to dashboard with new draft open for editing
        router.push(`/dashboard?tab=engagement&editDraft=${data.data.campaign.id}`);
      } else {
        throw new Error(data.error || 'Failed to create draft');
      }
    } catch (err) {
      console.error('Error creating draft:', err);
      alert('Failed to create draft from campaign');
    } finally {
      setCreatingDraft(false);
    }
  };

  // Render modal in portal to ensure it appears above all other content
  const modalContent = (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="6xl"
      zIndex={60}
      maxHeight="max-h-[90vh]"
      customHeader={
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-1">
                Campaign Preview
              </h2>
              {campaign && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    {campaign.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatCampaignDate(campaign.sentAt)} to {campaign.emailsSent} contact
                    {campaign.emailsSent !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      }
    >
      {/* Content Area - Same structure as EmailContentEditor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-muted">
            <LoadingSpinner size="lg" message="Loading campaign preview..." centered />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-muted">
            <ErrorState
              title="Failed to load preview"
              message={error}
              onRetry={fetchCampaignPreview}
              centered
            />
          </div>
        ) : campaign ? (
          <>
            {/* Sender Email Display */}
            <div className="px-6 py-3 bg-background border-b border-border">
              <p className="text-xs text-muted-foreground mb-0.5">From:</p>
              <p className="text-sm font-medium text-foreground">
                {campaign.senderName && campaign.senderEmail
                  ? `${campaign.senderName} <${campaign.senderEmail}>`
                  : campaign.senderEmail
                  ? campaign.senderEmail
                  : 'noreply@thebackstage.app'}
              </p>

              {campaign.senderEmail && !campaign.senderEmail.includes('thebackstage.app') && (
                <div className="mt-1.5 p-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ Note: If your domain is not verified, emails will be sent from noreply@thebackstage.app
                </div>
              )}
            </div>

            {/* Campaign Metadata - Compact */}
            {campaign.metadata && (
              <div className="px-6 py-2 bg-muted border-b border-border">
                <CampaignMetadata
                  metadata={campaign.metadata}
                  visibleFields={['track', 'greeting', 'signature']}
                />
              </div>
            )}

            {/* HTML Preview - Takes all remaining space (2.5x more space) */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-muted p-6">
              <EmailPreview
                htmlContent={campaign.htmlContent}
                height="h-full min-h-[500px]"
                sandbox={true}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Fixed Footer */}
      <ModalFooter>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Click Edit to create a new draft from this campaign
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={creatingDraft}
              className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleCreateDraft}
              disabled={creatingDraft || !campaign}
              className="px-6 py-2.5 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creatingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Creating Draft...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );

  // Use portal to render modal at document body level
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
