'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { CARD_STYLES, cn } from '@/domain/types/design-tokens';
import { EmailCampaign, EmailContent } from '../../types/dashboard';
import { useEmailCampaigns } from '../../hooks/useEmailCampaigns';
import DraftCard from './DraftCard';
import EmailContentEditor from './EmailContentEditor';
import SendingProgressModal from './SendingProgressModal';
import { WarmupProgressCard } from './WarmupProgressCard';

interface DraftsListProps {
  onDraftSent?: () => void;
}

interface SendResult {
  success: boolean;
  emailsSent: number;
  emailsFailed: number;
  totalContacts: number;
  duration: number;
  failures?: Array<{ email: string; error: string }>;
  error?: string;
}

export default function DraftsList({ onDraftSent }: DraftsListProps) {
  const { drafts, loading, loadDrafts, deleteDraft, sendDraft } = useEmailCampaigns();
  const [editingDraft, setEditingDraft] = useState<EmailCampaign | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadDrafts();
  }, []);

  // Auto-open draft when URL param 'editDraft' is present (from resend)
  useEffect(() => {
    const editDraftId = searchParams.get('editDraft');
    if (editDraftId && drafts.length > 0) {
      const draftToEdit = drafts.find(d => d.id === editDraftId);
      if (draftToEdit) {
        setEditingDraft(draftToEdit);
        // Clear URL param after opening
        window.history.replaceState({}, '', '/dashboard?tab=engagement');
      }
    }
  }, [searchParams, drafts]);

  const handleEdit = (draft: EmailCampaign) => {
    setEditingDraft(draft);
  };

  const handleDelete = async (draft: EmailCampaign) => {
    await deleteDraft(draft.id);
  };

  const handleSend = async (draft: EmailCampaign) => {
    // Show modal immediately with "Preparing..." state
    setSending(true);
    setSendResult(null);
    setTotalContacts(0); // Start with 0 to trigger "Preparing..." state

    try {
      const result = await sendDraft(draft.id);

      if (result.success) {
        // Update total contacts with actual value from API
        const actualContactCount = result.totalContacts || result.emailsSent || 0;
        setTotalContacts(actualContactCount);

        // Show success result in modal
        setSendResult({
          success: true,
          emailsSent: result.emailsSent || 0,
          emailsFailed: result.emailsFailed || 0,
          totalContacts: actualContactCount,
          duration: result.duration || 0,
          failures: result.failures
        });

        setEditingDraft(null);
        if (onDraftSent) {
          onDraftSent();
        }
      } else {
        // Show error result in modal
        setSendResult({
          success: false,
          emailsSent: 0,
          emailsFailed: 0,
          totalContacts: 0,
          duration: 0,
          error: result.error || 'Error desconocido'
        });
      }
    } catch (error: any) {
      // Show error result in modal
      setSendResult({
        success: false,
        emailsSent: 0,
        emailsFailed: 0,
        totalContacts: 0,
        duration: 0,
        error: error.message || 'Error al enviar la campaña'
      });
    } finally {
      // Keep modal open to show results
      // Modal will auto-close on success, or user can close on error
    }
  };

  const handleCloseProgressModal = () => {
    setSending(false);
    setSendResult(null);
    setTotalContacts(0);
  };

  const handleUpdateDraft = async (content: EmailContent) => {
    if (!editingDraft) return;

    try {
      // Update draft via API
      const res = await fetch(`/api/campaigns/${editingDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload drafts and close editor
      await loadDrafts();
      setEditingDraft(null);
    } catch (error) {
      console.error('Error updating draft:', error);
    }
  };

  const handleSendEditedDraft = async (content: EmailContent) => {
    if (!editingDraft) return;

    // First update the draft
    await handleUpdateDraft(content);

    // Then send it (handleSend manages the sending state and modal)
    await handleSend(editingDraft);
  };

  if (loading && drafts.length === 0) {
    return (
      <Card padding="lg" className="rounded-3xl">
        <div className="flex items-center justify-center py-8">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
        </div>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card padding="lg" className="rounded-3xl">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground/60 mb-2">No hay borradores</h3>
          <p className="text-sm text-foreground/40">
            Los borradores que guardes aparecerán aquí
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="subtle" padding="md" className="rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
              {drafts.length} saved
            </p>
          </div>
          <button
            onClick={loadDrafts}
            className="p-1.5 rounded-lg border border-border text-foreground/40 hover:text-foreground hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95"
            title="Recargar borradores"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {drafts.map((draft) => (
            <div key={draft.id} className="space-y-3">
              <DraftCard
                draft={draft}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSend={handleSend}
              />

              {/* Show warmup card if warmup is enabled for this draft */}
              {draft.warmupEnabled && (
                <WarmupProgressCard
                  campaignId={draft.id}
                  onRefresh={loadDrafts}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Draft Modal */}
      {editingDraft && (
        <Modal
          isOpen={true}
          onClose={() => setEditingDraft(null)}
          size="6xl"
          closeOnBackdropClick={false}
          customHeader={
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-serif text-foreground mb-1">
                    Editar Borrador
                  </h2>
                  <p className="text-sm text-foreground/50">
                    Personaliza el contenido antes de enviar
                  </p>
                </div>
                <button
                  onClick={() => setEditingDraft(null)}
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  disabled={sending}
                >
                  <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          }
        >
          <EmailContentEditor
            initialContent={{
              subject: editingDraft.subject || '',
              greeting: editingDraft.greeting || 'Hey mate,',
              message: editingDraft.message || '',
              signature: editingDraft.signature || 'Much love,\nGee Beat',
              coverImage: editingDraft.coverImageUrl || ''
            }}
            campaignId={editingDraft.id}
            onSave={handleSendEditedDraft}
            onSaveDraft={handleUpdateDraft}
            onClose={() => setEditingDraft(null)}
            saving={sending}
          />
        </Modal>
      )}

      {/* Sending Progress Modal */}
      <SendingProgressModal
        isOpen={sending}
        totalContacts={totalContacts}
        isTestMode={process.env.NEXT_PUBLIC_TEST_EMAIL_ONLY === 'true'}
        result={sendResult}
        onClose={handleCloseProgressModal}
      />
    </>
  );
}
