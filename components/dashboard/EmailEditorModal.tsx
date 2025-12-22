'use client';

import { useState } from 'react';
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
        subject: 'New music from Gee Beat',
        greeting: 'Hey mate,',
        message: 'This is my new track and it\'s now on Soundcloud!',
        signature: 'Much love,\nGee Beat'
      });
    }
    setStep('edit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6DF]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">
                {step === 'choose' ? 'Crear Nuevo Email' : 'Editor de Email'}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 'choose'
                  ? 'Selecciona un punto de partida para tu email'
                  : 'Personaliza el contenido de tu email'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#F5F3ED] transition-colors"
              disabled={saving}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
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
      </div>
    </div>
  );
}
