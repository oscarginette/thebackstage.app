'use client';

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages with i18n support.
 * Maps error codes from error catalog to translated messages.
 *
 * Features:
 * - Specific error messages based on error code
 * - Fallback to generic messages for unknown errors
 * - Technical details in development mode
 * - Retry and navigation actions
 * - Error code display for support
 */

import { useTranslations } from '@/lib/i18n/context';
import { ERROR_CATALOG, isKnownErrorCode, type ErrorCode } from '@/lib/errors/error-catalog';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: Error & { code?: string; digest?: string };
  reset?: () => void;
  showTechnicalDetails?: boolean;
}

export default function ErrorDisplay({ error, reset, showTechnicalDetails = false }: ErrorDisplayProps) {
  const t = useTranslations('errors');
  const tCommon = useTranslations('errors.common');

  // Determine error code
  const errorCode: ErrorCode | string = error.code || 'UNEXPECTED_ERROR';
  const isKnown = isKnownErrorCode(errorCode);

  // Get error metadata from catalog
  const errorMetadata = isKnown ? ERROR_CATALOG[errorCode] : null;

  // Get user-friendly message from i18n
  const getMessage = (): string => {
    if (isKnown && errorMetadata) {
      // Get translated message using messageKey from catalog
      const key = errorMetadata.messageKey.replace('errors.', '');
      return t(key as any) || error.message;
    }
    return error.message || tCommon('unexpected');
  };

  const message = getMessage();
  const retryable = errorMetadata?.retryable ?? true;
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-4">
          ¡Ups! Algo salió mal
        </h1>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <p className="text-gray-700 text-center leading-relaxed">
            {message}
          </p>

          {/* Error Code (for support) */}
          {errorCode && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                {tCommon('errorCode')}: <span className="font-mono font-semibold">{errorCode}</span>
                {error.digest && ` (${error.digest})`}
              </p>
            </div>
          )}
        </div>

        {/* Technical Details (Dev Only) */}
        {(isDev || showTechnicalDetails) && error.message && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <h3 className="font-semibold text-red-800 mb-2 text-sm">
              {tCommon('technicalDetails')}
            </h3>
            <pre className="overflow-x-auto text-xs text-red-700 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {retryable && reset && (
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              {tCommon('tryAgain')}
            </button>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            {tCommon('goHome')}
          </button>
        </div>

        {/* Support Message */}
        <p className="mt-6 text-sm text-gray-500 text-center">
          {tCommon('contactSupport')}
        </p>
      </div>
    </div>
  );
}
