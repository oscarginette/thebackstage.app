'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { EmailCampaign, EmailContent } from '../../types/dashboard';
import { useEmailCampaigns } from '../../hooks/useEmailCampaigns';
import DraftCard from './DraftCard';
import EmailContentEditor from './EmailContentEditor';

interface DraftsListProps {
  onDraftSent?: () => void;
}

export default function DraftsList({ onDraftSent }: DraftsListProps) {
  const { drafts, loading, loadDrafts, deleteDraft, sendDraft } = useEmailCampaigns();
  const [editingDraft, setEditingDraft] = useState<EmailCampaign | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleEdit = (draft: EmailCampaign) => {
    setEditingDraft(draft);
  };

  const handleDelete = async (draft: EmailCampaign) => {
    await deleteDraft(draft.id);
  };

  const handleSend = async (draft: EmailCampaign) => {
    setSending(true);
    try {
      const result = await sendDraft(draft.id);
      if (result.success) {
        setEditingDraft(null);
        if (onDraftSent) {
          onDraftSent();
        }
      }
    } finally {
      setSending(false);
    }
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

    setSending(true);
    try {
      // First update the draft
      await handleUpdateDraft(content);

      // Then send it
      await handleSend(editingDraft);
    } finally {
      setSending(false);
    }
  };

  if (loading && drafts.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E6DF] p-8">
        <div className="flex items-center justify-center py-8">
          <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E6DF] p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay borradores</h3>
          <p className="text-sm text-gray-400">
            Los borradores que guardes aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-[#E8E6DF]/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-serif text-[#1c1c1c]">Drafts</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {drafts.length} saved
            </p>
          </div>
          <button
            onClick={loadDrafts}
            className="p-1.5 rounded-lg border border-[#E8E6DF]/60 text-gray-400 hover:text-[#1c1c1c] hover:bg-white transition-all active:scale-95"
            title="Recargar borradores"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSend={handleSend}
            />
          ))}
        </div>
      </div>

      {/* Edit Draft Modal */}
      {editingDraft && (
        <Modal
          isOpen={true}
          onClose={() => setEditingDraft(null)}
          size="6xl"
          customHeader={
            <div className="p-6 border-b border-[#E8E6DF]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">
                    Editar Borrador
                  </h2>
                  <p className="text-sm text-gray-500">
                    Personaliza el contenido antes de enviar
                  </p>
                </div>
                <button
                  onClick={() => setEditingDraft(null)}
                  className="p-2 rounded-xl hover:bg-[#F5F3ED] transition-colors"
                  disabled={sending}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          }
        >
          <EmailContentEditor
            initialContent={{
              subject: editingDraft.subject,
              greeting: 'Hey mate,',
              message: '',
              signature: 'Much love,\nGee Beat'
            }}
            onSave={handleSendEditedDraft}
            onSaveDraft={handleUpdateDraft}
            onClose={() => setEditingDraft(null)}
            saving={sending}
          />
        </Modal>
      )}
    </>
  );
}
