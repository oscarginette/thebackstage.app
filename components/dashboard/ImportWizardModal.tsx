'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FileUploadStep from './import/FileUploadStep';
import ColumnMappingStep from './import/ColumnMappingStep';
import PreviewStep from './import/PreviewStep';
import ResultsStep from './import/ResultsStep';

/**
 * ImportWizardModal
 *
 * Multi-step modal for importing contacts from CSV/JSON.
 * Manages state flow between steps and handles API communication.
 *
 * Steps:
 * 1. upload - File selection and parsing
 * 2. mapping - Column mapping verification
 * 3. preview - Data preview and confirmation
 * 4. importing - Import in progress
 * 5. results - Import results
 */

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ImportPreview {
  filename: string;
  fileType: 'csv' | 'json';
  fileSizeBytes: number;
  totalRows: number;
  detectedColumns: Array<{
    originalName: string;
    suggestedField: 'email' | 'name' | 'subscribed' | null;
    sampleValues: string[];
    confidence: number;
  }>;
  sampleRows: any[];
  rawData: any[];
}

interface ColumnMappingData {
  emailColumn: string;
  nameColumn: string | null;
  subscribedColumn: string | null;
  metadataColumns: string[];
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

interface QuotaInfo {
  exceeded: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  message?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportWizardModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingData | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state
    setCurrentStep('upload');
    setPreview(null);
    setColumnMapping(null);
    setResults(null);
    setQuotaInfo(null);
    setError(null);
    onClose();
  };

  const handleUploadComplete = (uploadedPreview: ImportPreview) => {
    setPreview(uploadedPreview);
    setError(null);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mapping: ColumnMappingData) => {
    setColumnMapping(mapping);
    setCurrentStep('preview');
  };

  const handlePreviewConfirm = async () => {
    if (!preview || !columnMapping) return;

    setCurrentStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/contacts/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData: preview.rawData,
          columnMapping,
          fileMetadata: {
            filename: preview.filename,
            fileType: preview.fileType,
            fileSizeBytes: preview.fileSizeBytes,
            totalRows: preview.totalRows
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.import);
      setQuotaInfo(data.quota || null);
      setCurrentStep('results');
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('preview'); // Go back to preview on error
    }
  };

  const handleResultsComplete = () => {
    onSuccess(); // Refresh contacts list
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      customHeader={
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E8E6DF]">
            <div>
              <h2 className="text-2xl font-bold text-[#1c1c1c]">Import Contacts</h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 'upload' && 'Upload CSV or JSON file'}
                {currentStep === 'mapping' && 'Verify column mappings'}
                {currentStep === 'preview' && 'Preview and confirm'}
                {currentStep === 'importing' && 'Importing contacts...'}
                {currentStep === 'results' && 'Import complete'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
              disabled={currentStep === 'importing'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 border-b border-[#E8E6DF]">
            <div className="flex items-center justify-between">
              {(['upload', 'mapping', 'preview', 'results'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === step
                        ? 'bg-[#FF5500] text-white'
                        : ['upload', 'mapping', 'preview'].indexOf(currentStep) > index ||
                          currentStep === 'importing' ||
                          currentStep === 'results'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        ['upload', 'mapping', 'preview'].indexOf(currentStep) > index ||
                        currentStep === 'importing' ||
                        currentStep === 'results'
                          ? 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      }
    >
      <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {currentStep === 'upload' && (
            <FileUploadStep onComplete={handleUploadComplete} onError={setError} />
          )}

          {currentStep === 'mapping' && preview && (
            <ColumnMappingStep
              preview={preview}
              onComplete={handleMappingComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'preview' && preview && columnMapping && (
            <PreviewStep
              preview={preview}
              columnMapping={columnMapping}
              onConfirm={handlePreviewConfirm}
              onBack={() => setCurrentStep('mapping')}
            />
          )}

          {currentStep === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-lg font-medium text-gray-700">Importing contacts...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          )}

          {currentStep === 'results' && results && (
            <ResultsStep results={results} quotaInfo={quotaInfo} onComplete={handleResultsComplete} />
          )}
      </div>
    </Modal>
  );
}

