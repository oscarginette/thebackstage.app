'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { EmailContent, EmailTemplate } from '../../types/dashboard';
import TemplateChooser from './TemplateChooser';
import EmailContentEditor from './EmailContentEditor';

interface EmailEditorModalProps {
  onClose: () => void;
  onSave: (content: EmailContent) => Promise<void>;
  onSaveDraft: (content: EmailContent) => Promise<void>;
  defaultTemplate?: EmailTemplate | null;
  saving?: boolean;
}

type EditorStep = 'choose' | 'edit';

export default function EmailEditorModal({
  onClose,
  onSave,
  onSaveDraft,
  defaultTemplate,
  saving = false
}: EmailEditorModalProps) {
  const [step, setStep] = useState<EditorStep>('choose');
  const [content, setContent] = useState<EmailContent>({
    subject: '',
    greeting: '',
    message: '',
    signature: ''
  });

  const handleSelectBlank = () => {
    setContent({
      subject: '',
      greeting: '',
      message: '',
      signature: 'Much love,\nGee Beat'
    });
    setStep('edit');
  };

  const handleSelectDefault = () => {
    if (defaultTemplate) {
      setContent({
        subject: defaultTemplate.subject,
        greeting: defaultTemplate.greeting,
        message: defaultTemplate.message,
        signature: defaultTemplate.signature
      });
    } else {
      // Fallback to hardcoded default
      setContent({
        subject: 'New music from The Backstage',
        greeting: 'Hey mate,',
        message: 'This is my new track and it\'s now on Soundcloud!',
        signature: 'Much love,\nGee Beat'
      });
    }
    setStep('edit');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="6xl"
      customHeader={
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-0.5">
                {step === 'choose' ? 'Crear Nuevo Email' : 'Editor de Email'}
              </h2>
              <p className="text-sm text-muted-foreground font-light">
                {step === 'choose'
                  ? 'Selecciona un punto de partida para tu mensaje'
                  : 'Personaliza y envía tu comunicado'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="group p-2 rounded-full hover:bg-muted transition-colors"
              disabled={saving}
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }
    >
      {step === 'choose' ? (
        <TemplateChooser
          onSelectBlank={handleSelectBlank}
          onSelectDefault={handleSelectDefault}
          onClose={onClose}
        />
      ) : (
        <EmailContentEditor
          initialContent={content}
          onSave={onSave}
          onSaveDraft={onSaveDraft}
          onClose={onClose}
          saving={saving}
        />
      )}
    </Modal>
  );
}
