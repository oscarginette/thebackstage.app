'use client';

/**
 * Global Error Boundary
 *
 * Catches all unhandled errors in the application.
 * Automatically reports errors to Sentry for monitoring.
 * Provides user-friendly error UI with specific messages using error catalog.
 *
 * Features:
 * - Specific error messages based on error code
 * - i18n support for error messages
 * - Automatic Sentry error tracking
 * - User-friendly recovery options
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import ErrorDisplay from '@/components/error-boundary/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture error to Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        errorCode: error.code || 'UNKNOWN',
        digest: error.digest,
      },
      extra: {
        message: error.message,
        stack: error.stack,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught error:', {
        code: error.code,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
  }, [error]);

  return <ErrorDisplay error={error} reset={reset} />;
}
