'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { SoundCloudTrack } from '../../types/dashboard';
import { useTranslations } from '@/lib/i18n/context';
import { useEmailPreview } from '@/hooks/useEmailPreview';

interface EmailPreviewModalProps {
  track: SoundCloudTrack;
  onClose: () => void;
  onConfirm: (customContent?: { subject?: string; greeting?: string; message?: string; signature?: string }) => void;
  sending: boolean;
  contactsCount: number;
}

export default function EmailPreviewModal({
  track,
  onClose,
  onConfirm,
  sending,
  contactsCount
}: EmailPreviewModalProps) {
  const t = useTranslations('dashboard.emails.preview');
  const [editMode, setEditMode] = useState(false);

  // Email content states
  const [subject, setSubject] = useState('New music from The Backstage');
  const [greeting, setGreeting] = useState('Hey mate,');
  const [message, setMessage] = useState(`This is my new track **${track.title}** and it's now on Soundcloud!`);
  const [signature, setSignature] = useState('Much love,\nThe Backstage');

  // Debounced email preview hook (prevents flicker on every keystroke)
  const { previewHtml, isLoadingPreview: loading } = useEmailPreview(
    track.title,
    track.url,
    track.coverImage || '',
    editMode ? greeting : undefined,
    editMode ? message : undefined,
    editMode ? signature : undefined
  );

  const handleConfirm = () => {
    if (editMode) {
      onConfirm({
        subject,
        greeting,
        message,
        signature
      });
    } else {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="6xl"
      customHeader={
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-1">
                {track.alreadySent ? t('resendTitle') : t('title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {track.title} • {contactsCount === 1 ? t('sendTo', { count: contactsCount }) : t('sendToPlural', { count: contactsCount })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  editMode
                    ? 'bg-accent text-white'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
                disabled={sending}
              >
                {editMode ? t('previewMode') : t('editMode')}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                disabled={sending}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {track.alreadySent && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t('alreadySent')}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {t('alreadySentWarning')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      <>
        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Panel (if edit mode) */}
          {editMode && (
            <div className="w-1/2 border-r border-border overflow-y-auto p-6 bg-muted">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('customizeContent')}</h3>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    {t('subject')}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder={t('subjectPlaceholder')}
                  />
                </div>

                {/* Greeting */}
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    {t('greeting')}
                  </label>
                  <input
                    type="text"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder={t('greetingPlaceholder')}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    {t('message')}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    placeholder={t('messagePlaceholder')}
                  />
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    {t('signature')}
                  </label>
                  <textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                    placeholder={t('signaturePlaceholder')}
                  />
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSubject('New music from The Backstage');
                    setGreeting('Hey mate,');
                    setMessage(`This is my new track **${track.title}** and it's now on Soundcloud!`);
                    setSignature('Much love,\nThe Backstage');
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                >
                  {t('reset')}
                </button>
              </div>
            </div>
          )}

          {/* Preview Panel */}
          <div className={`${editMode ? 'w-1/2' : 'w-full'} overflow-y-auto p-6 bg-muted`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px] border-0"
                  title="Email Preview"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {t('subjectLabel')} <span className="font-medium text-foreground">{subject}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    {track.alreadySent ? t('resend') : t('confirm')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    </Modal>
  );
}
