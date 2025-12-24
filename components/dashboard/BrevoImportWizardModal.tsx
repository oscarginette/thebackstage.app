'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download } from 'lucide-react';
import PreviewStep from './import/PreviewStep';
import ResultsStep from './import/ResultsStep';

type Step = 'fetching' | 'preview' | 'importing' | 'results';

interface BrevoImportPreview {
  filename: string;
  fileType: 'brevo';
  totalRows: number;
  totalRowsAvailable: number;
  sampleRows: any[];
  detectedColumns: any[];
  metadata?: {
    listsProcessed: Array<{ id: number; name: string; totalSubscribers: number }>;
    brevoSource: boolean;
  };
}

interface ImportResults {
  importId: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  duration: number;
  hasErrors: boolean;
  errors?: Array<{ email: string; error: string }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BrevoImportWizardModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('fetching');
  const [preview, setPreview] = useState<BrevoImportPreview | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch preview on open
  useState(() => {
    if (isOpen && currentStep === 'fetching') {
      fetchPreview();
    }
  });

  const fetchPreview = async () => {
    try {
      setError(null);
      setCurrentStep('fetching');

      const response = await fetch('/api/integrations/brevo/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch preview');
      }

      const data = await response.json();
      setPreview(data.preview);
      setCurrentStep('preview');

    } catch (err: any) {
      console.error('Preview fetch error:', err);
      setError(err.message);
      setCurrentStep('preview'); // Show error in preview step
    }
  };

  const handleConfirmImport = async () => {
    try {
      setError(null);
      setCurrentStep('importing');

      const response = await fetch('/api/integrations/brevo/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute import');
      }

      const data = await response.json();
      setResults(data.import);
      setCurrentStep('results');

    } catch (err: any) {
      console.error('Import execute error:', err);
      setError(err.message);
      setCurrentStep('preview'); // Go back to preview with error
    }
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep('fetching');
    setPreview(null);
    setResults(null);
    setError(null);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">
                Import from Brevo
              </h2>
              <p className="text-sm text-gray-500">
                {currentStep === 'fetching' && 'Fetching contacts from Brevo...'}
                {currentStep === 'preview' && 'Review contacts before importing'}
                {currentStep === 'importing' && 'Importing contacts...'}
                {currentStep === 'results' && 'Import complete'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              disabled={currentStep === 'importing'}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Fetching Preview */}
            {currentStep === 'fetching' && (
              <motion.div
                key="fetching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-12 h-12 text-[#0B996E] animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-700">Fetching contacts from Brevo...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-red-600">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      <button
                        onClick={fetchPreview}
                        className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {preview && !error && (
                  <>
                    <PreviewStep
                      preview={preview}
                      columnMapping={{
                        emailColumn: 'email',
                        nameColumn: 'name',
                        subscribedColumn: 'subscribed',
                        metadataColumns: []
                      }}
                      onConfirm={handleConfirmImport}
                      onBack={handleClose}
                    />

                    {/* Brevo-specific info */}
                    {preview.metadata?.listsProcessed && preview.metadata.listsProcessed.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                          Brevo Lists Processed
                        </p>
                        <div className="space-y-1">
                          {preview.metadata.listsProcessed.slice(0, 5).map(list => (
                            <div key={list.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{list.name}</span>
                              <span className="text-gray-500">{list.totalSubscribers?.toLocaleString()} contacts</span>
                            </div>
                          ))}
                          {preview.metadata.listsProcessed.length > 5 && (
                            <p className="text-xs text-gray-500 mt-2">
                              +{preview.metadata.listsProcessed.length - 5} more lists
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {preview.totalRowsAvailable > preview.totalRows && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> Previewing first {preview.totalRows.toLocaleString()} contacts.
                          Import will process all {preview.totalRowsAvailable.toLocaleString()} contacts.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Importing */}
            {currentStep === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-blue-600 animate-bounce" />
                </div>
                <p className="text-lg font-medium text-gray-700">Importing contacts...</p>
                <p className="text-sm text-gray-500 mt-2">Processing contacts in batches</p>
              </motion.div>
            )}

            {/* Step 4: Results */}
            {currentStep === 'results' && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ResultsStep
                  results={{
                    filename: preview?.filename || 'Brevo Import',
                    fileType: 'brevo',
                    contactsInserted: results.contactsInserted,
                    contactsUpdated: results.contactsUpdated,
                    contactsSkipped: results.contactsSkipped,
                    duration: results.duration,
                    errors: results.errors || []
                  }}
                  onComplete={handleSuccess}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
