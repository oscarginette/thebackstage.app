'use client';

import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ImportResults {
  importId?: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  duration: number;
  hasErrors?: boolean;
  errors?: Array<{ email: string; error: string }>;
  filename?: string;
  fileType?: string;
}

interface Props {
  results: ImportResults;
  onComplete: () => void;
}

export default function ResultsStep({ results, onComplete }: Props) {
  const totalProcessed = results.contactsInserted + results.contactsUpdated + results.contactsSkipped;
  const successRate = totalProcessed > 0
    ? ((results.contactsInserted + results.contactsUpdated) / totalProcessed * 100).toFixed(1)
    : 0;

  const hasWarnings = results.contactsSkipped > 0 || results.hasErrors;

  return (
    <div className="space-y-3">
      {/* Status Banner - Compacto */}
      <div className={`rounded-xl p-3 ${
        !hasWarnings
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center gap-2">
          {!hasWarnings ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <div>
            <h3 className={`text-sm font-bold ${
              !hasWarnings ? 'text-emerald-900' : 'text-yellow-900'
            }`}>
              {!hasWarnings ? 'Import Successful!' : 'Import Completed with Warnings'}
            </h3>
            <p className={`text-xs ${
              !hasWarnings ? 'text-emerald-700' : 'text-yellow-700'
            }`}>
              {!hasWarnings
                ? 'All contacts were imported successfully'
                : 'Some contacts were skipped or had errors'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Compacto */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Inserted</p>
          <p className="text-lg font-bold text-emerald-900">{results.contactsInserted.toLocaleString()}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Updated</p>
          <p className="text-lg font-bold text-blue-900">{results.contactsUpdated.toLocaleString()}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-2 border border-red-200">
          <p className="text-[9px] font-bold uppercase tracking-wider text-red-600">Skipped</p>
          <p className="text-lg font-bold text-red-900">{results.contactsSkipped.toLocaleString()}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">Duration</p>
          <p className="text-lg font-bold text-gray-900">{(results.duration / 1000).toFixed(1)}s</p>
        </div>
      </div>

      {/* Success Rate - Compacto */}
      <div className="bg-white rounded-lg p-2 border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Success Rate</span>
          <span className="text-xs font-bold text-gray-900">{successRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Errors List - Compacto */}
      {results.hasErrors && results.errors && results.errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
            Errors ({results.errors.length})
          </h3>
          <div className="bg-red-50 rounded-lg border border-red-200 max-h-32 overflow-y-auto">
            <div className="divide-y divide-red-100">
              {results.errors.slice(0, 10).map((error, idx) => (
                <div key={idx} className="p-2 flex items-start gap-2">
                  <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-900 truncate">{error.email || 'Unknown'}</p>
                    <p className="text-[10px] text-red-700">{error.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {results.errors.length > 10 && (
            <p className="text-[9px] text-gray-500 text-center">
              Showing first 10 of {results.errors.length} errors
            </p>
          )}
        </div>
      )}

      {/* Action - Compacto */}
      <button
        onClick={onComplete}
        className="w-full px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 bg-[#FF5500] text-white hover:bg-[#FF5500]/90"
      >
        Done
      </button>
    </div>
  );
}
