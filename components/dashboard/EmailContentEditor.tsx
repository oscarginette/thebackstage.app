'use client';

import { useState, useEffect, useRef } from 'react';
import { EmailContent } from '../../types/dashboard';
import { useTranslations } from '@/lib/i18n/context';
import ListSelector from './ListSelector';
import { LIST_FILTER_MODES } from '@/domain/value-objects/ListFilterCriteria';
import RichTextEditor from '@/components/ui/RichTextEditor';
import EmailPreview from '@/components/ui/EmailPreview';
import { useAutoSaveCampaign } from '@/hooks/useAutoSaveCampaign';
import { formatTimeAgo } from '@/lib/date-utils';
// TODO: Re-enable when email content validation feature is committed
// import { useEmailContentValidation } from '@/hooks/useEmailContentValidation';
// import { Tooltip } from '@/components/ui/Tooltip';

interface EmailContentEditorProps {
  initialContent: EmailContent;
  onSave: (content: EmailContent) => Promise<void>;
  onSaveDraft: (content: EmailContent) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

/**
 * CoverImageUpload Component
 *
 * Allows users to either:
 * 1. Upload a file (desktop browse + mobile camera/gallery)
 * 2. Enter a URL manually
 */
function CoverImageUpload({
  currentImage,
  onImageChange
}: {
  currentImage: string;
  onImageChange: (url: string) => void;
}) {
  const t = useTranslations('dashboard.emails.editor');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/upload/cover-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        onImageChange(result.imageUrl);
        setUrlInput(result.imageUrl);
      } else {
        setError(result.error || t('uploadError'));
      }
    } catch (err) {
      setError(t('uploadError'));
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onImageChange(url);
  };

  const handleRemoveImage = () => {
    onImageChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground/70">
          {t('coverImage')}
          <span className="text-xs text-muted-foreground ml-2">{t('coverImageOptional')}</span>
        </label>

        {/* Toggle between file upload and URL input */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              inputMode === 'file'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('uploadFile')}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              inputMode === 'url'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('url')}
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {currentImage && currentImage.trim().length > 0 && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt={t('coverPreview')}
            className="max-w-full h-auto max-h-48 rounded-lg border border-gray-300"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
              setError(t('invalidImageUrl'));
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            title={t('removeImage')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* File Upload Mode */}
      {inputMode === 'file' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer"
            capture="environment"
          />

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              {t('uploading')}
            </div>
          )}

          <p className="text-xs text-gray-500">
            {t('formats')}
          </p>
        </>
      )}

      {/* URL Input Mode */}
      {inputMode === 'url' && (
        <>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            placeholder={t('urlPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">
            {t('urlHelp')}
          </p>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * AutoSaveIndicator Component
 *
 * Shows save status in footer
 */
function AutoSaveIndicator({
  status,
  lastSavedAt
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
}) {
  const t = useTranslations('dashboard.emails.editor');

  if (status === 'idle' || !lastSavedAt) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status === 'saving' && (
        <>
          <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span>{t('autoSaving')}</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{t('autoSaved')} • {formatTimeAgo(lastSavedAt)}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-600">{t('autoSaveError')}</span>
        </>
      )}
    </div>
  );
}

export default function EmailContentEditor({
  initialContent,
  onSave,
  onSaveDraft,
  onClose,
  saving = false
}: EmailContentEditorProps) {
  const t = useTranslations('dashboard.emails.editor');
  const [subject, setSubject] = useState(initialContent.subject);
  const [greeting, setGreeting] = useState(initialContent.greeting);
  const [message, setMessage] = useState(initialContent.message);
  const [signature, setSignature] = useState(initialContent.signature);
  const [coverImage, setCoverImage] = useState(initialContent.coverImage || '');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [senderInfo, setSenderInfo] = useState<{ email: string; name?: string } | null>(null);
  const [loadingSender, setLoadingSender] = useState(true);

  // Auto-save hook
  const { saveStatus, lastSavedAt, autoSave } = useAutoSaveCampaign();

  // Real-time validation
  // TODO: Re-enable when email content validation feature is committed
  // const validation = useEmailContentValidation({
  //   subject,
  //   greeting,
  //   message,
  //   signature
  // });
  // Temporary stub until validation feature is added
  const validation = {
    isValid: true,
    saveButtonTooltip: '',
    errors: [],
    fieldHasError: (_field: string) => false,
    getFieldErrorMessages: (_field: string) => []
  };

  // List filter state
  const [listFilterMode, setListFilterMode] = useState<'all' | 'include' | 'exclude'>(
    initialContent.listFilter?.mode === LIST_FILTER_MODES.SPECIFIC_LISTS ? 'include' :
    initialContent.listFilter?.mode === LIST_FILTER_MODES.EXCLUDE_LISTS ? 'exclude' : 'all'
  );
  const [selectedListIds, setSelectedListIds] = useState<string[]>(
    initialContent.listFilter?.listIds || []
  );

  useEffect(() => {
    fetchPreview();
  }, [subject, greeting, message, signature, coverImage]);

  useEffect(() => {
    fetchSenderInfo();
  }, []);

  // Auto-save on every field change
  useEffect(() => {
    const listFilter = listFilterMode === 'all'
      ? undefined
      : {
          mode: listFilterMode === 'include'
            ? LIST_FILTER_MODES.SPECIFIC_LISTS
            : LIST_FILTER_MODES.EXCLUDE_LISTS,
          listIds: selectedListIds,
        };

    autoSave({
      subject,
      greeting,
      message,
      signature,
      coverImage: coverImage || undefined,
      listFilter
    });
  }, [subject, greeting, message, signature, coverImage, listFilterMode, selectedListIds, autoSave]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/test-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: 'Preview',
          trackUrl: '#',
          coverImage: coverImage || '',
          customContent: {
            greeting,
            message,
            signature
          }
        })
      });

      const data = await res.json();
      setPreviewHtml(data.html || '');
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchSenderInfo = async () => {
    setLoadingSender(true);
    try {
      const res = await fetch('/api/user/settings');

      if (res.ok) {
        const response = await res.json();
        // Response structure: { success: true, data: { settings: {...} } }
        const settings = response?.data?.settings;

        if (settings) {
          setSenderInfo({
            email: settings.senderEmail || 'noreply@thebackstage.app',
            name: settings.senderName || undefined
          });
        } else {
          // Fallback to default if settings is null/undefined
          setSenderInfo({
            email: 'noreply@thebackstage.app'
          });
        }
      } else {
        // Fallback to default
        setSenderInfo({
          email: 'noreply@thebackstage.app'
        });
      }
    } catch (error) {
      console.error('[EmailEditor] Error fetching sender info:', error);
      // Fallback to default
      setSenderInfo({
        email: 'noreply@thebackstage.app'
      });
    } finally {
      setLoadingSender(false);
    }
  };

  const handleSave = async () => {
    // Build listFilter object
    const listFilter = listFilterMode === 'all'
      ? undefined
      : {
          mode: listFilterMode === 'include'
            ? LIST_FILTER_MODES.SPECIFIC_LISTS
            : LIST_FILTER_MODES.EXCLUDE_LISTS,
          listIds: selectedListIds,
        };

    await onSave({
      subject,
      greeting,
      message,
      signature,
      coverImage: coverImage || undefined,
      listFilter
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Panel and Preview */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Panel */}
        <div className="w-1/2 border-r border-border overflow-y-auto p-6 bg-muted">
          <h3 className="text-xl font-serif text-foreground mb-4">{t('title')}</h3>

          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2 font-serif">
                {t('subject')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-6 py-3 rounded-2xl border bg-background text-foreground focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${
                  validation.fieldHasError('subject')
                    ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-border focus:ring-4 focus:ring-accent/10 focus:border-accent hover:border-accent/30'
                }`}
                placeholder={t('subjectPlaceholder')}
                aria-invalid={validation.fieldHasError('subject')}
                aria-describedby={validation.fieldHasError('subject') ? 'subject-error' : undefined}
              />
              {validation.fieldHasError('subject') && (
                <p id="subject-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validation.getFieldErrorMessages('subject').join('. ')}
                </p>
              )}
            </div>

            {/* List Selector */}
            <div>
              <ListSelector
                selectedListIds={selectedListIds}
                onChange={setSelectedListIds}
                mode={listFilterMode}
                onModeChange={setListFilterMode}
              />
            </div>

            {/* Cover Image Upload */}
            <CoverImageUpload
              currentImage={coverImage}
              onImageChange={setCoverImage}
            />

            {/* Greeting */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2 font-serif">
                {t('greeting')}
              </label>
              <RichTextEditor
                value={greeting}
                onChange={setGreeting}
                placeholder={t('greetingPlaceholder')}
                hasError={validation.fieldHasError('greeting')}
                maxLength={200}
                minHeight="80px"
              />
              {validation.fieldHasError('greeting') && (
                <p id="greeting-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validation.getFieldErrorMessages('greeting').join('. ')}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2 font-serif">
                {t('message')}
              </label>
              <RichTextEditor
                value={message}
                onChange={setMessage}
                placeholder={t('messagePlaceholder')}
                hasError={validation.fieldHasError('message')}
                maxLength={5000}
                minHeight="240px"
              />
              {validation.fieldHasError('message') && (
                <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validation.getFieldErrorMessages('message').join('. ')}
                </p>
              )}
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2 font-serif">
                {t('signature')}
              </label>
              <RichTextEditor
                value={signature}
                onChange={setSignature}
                placeholder={t('signaturePlaceholder')}
                hasError={validation.fieldHasError('signature')}
                maxLength={500}
                minHeight="100px"
              />
              {validation.fieldHasError('signature') && (
                <p id="signature-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validation.getFieldErrorMessages('signature').join('. ')}
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSubject(initialContent.subject);
                setGreeting(initialContent.greeting);
                setMessage(initialContent.message);
                setSignature(initialContent.signature);
                setCoverImage(initialContent.coverImage || '');
              }}
              className="w-full px-6 py-3 rounded-full border border-border text-sm text-muted-foreground hover:bg-card hover:text-foreground hover:border-foreground transition-colors"
            >
              {t('reset')}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col bg-muted">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-serif text-foreground mb-4">{t('preview')}</h3>

            {/* Sender Info Display */}
            <div className="mb-4 text-sm text-muted-foreground">
              {loadingSender ? (
                <span>{t('loadingSender')}</span>
              ) : senderInfo ? (
                <span>
                  <span className="font-medium">{t('fromLabel')}</span>{' '}
                  {senderInfo.name ? (
                    <>{senderInfo.name} &lt;{senderInfo.email}&gt;</>
                  ) : (
                    <>{senderInfo.email}</>
                  )}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <EmailPreview
              htmlContent={previewHtml}
              loading={loadingPreview}
              height="h-full"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground">
              {t('subjectLabel')} <span className="font-serif text-foreground ml-1">{subject}</span>
            </div>
            <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <span className="font-serif italic">{t('sendEmail')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
