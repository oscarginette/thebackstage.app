'use client';

import { useState, useEffect, useRef } from 'react';
import { EmailContent } from '../../types/dashboard';
import { useTranslations } from '@/lib/i18n/context';
import ListSelector from './ListSelector';
import { LIST_FILTER_MODES } from '@/domain/value-objects/ListFilterCriteria';
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
  const [savingDraft, setSavingDraft] = useState(false);

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

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      // Build listFilter object
      const listFilter = listFilterMode === 'all'
        ? undefined
        : {
            mode: listFilterMode === 'include'
              ? LIST_FILTER_MODES.SPECIFIC_LISTS
              : LIST_FILTER_MODES.EXCLUDE_LISTS,
            listIds: selectedListIds,
          };

      await onSaveDraft({
        subject,
        greeting,
        message,
        signature,
        coverImage: coverImage || undefined,
        listFilter
      });
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Panel and Preview */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Panel */}
        <div className="w-1/2 border-r border-border overflow-y-auto p-8 bg-muted">
          <h3 className="text-xl font-serif text-foreground mb-6">{t('title')}</h3>

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
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 transition-all ${
                  validation.fieldHasError('subject')
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
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
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 transition-all ${
                  validation.fieldHasError('greeting')
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
                placeholder={t('greetingPlaceholder')}
                aria-invalid={validation.fieldHasError('greeting')}
                aria-describedby={validation.fieldHasError('greeting') ? 'greeting-error' : undefined}
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
                <span className="text-xs text-muted-foreground font-sans ml-2">{t('messageHint')}</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 transition-all resize-none ${
                  validation.fieldHasError('message')
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
                placeholder={t('messagePlaceholder')}
                aria-invalid={validation.fieldHasError('message')}
                aria-describedby={validation.fieldHasError('message') ? 'message-error' : undefined}
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
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 transition-all resize-none ${
                  validation.fieldHasError('signature')
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-border focus:ring-accent/20 focus:border-accent'
                }`}
                placeholder={t('signaturePlaceholder')}
                aria-invalid={validation.fieldHasError('signature')}
                aria-describedby={validation.fieldHasError('signature') ? 'signature-error' : undefined}
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
          <div className="p-8 pb-4">
            <h3 className="text-xl font-serif text-foreground mb-6">{t('preview')}</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden h-full">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Email Preview"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {t('subjectLabel')} <span className="font-serif text-foreground ml-1">{subject}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving || savingDraft}
              className="px-6 py-3 rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            {/* TODO: Re-enable Tooltip when validation feature is committed */}
            <button
              onClick={handleSaveDraft}
              disabled={!validation.isValid || saving || savingDraft}
              className={`px-6 py-3 rounded-full border text-foreground flex items-center gap-2 transition-all ${
                validation.isValid && !saving && !savingDraft
                  ? 'border-border hover:border-foreground hover:bg-muted cursor-pointer'
                  : 'border-border opacity-50 cursor-not-allowed'
              }`}
              title={validation.isValid ? t('saveDraft') : validation.saveButtonTooltip}
            >
              {savingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {t('saveDraft')}
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || savingDraft}
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
