'use client';

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages.
 * Maps error codes from error catalog to translated messages.
 *
 * Features:
 * - Specific error messages based on error code
 * - Fallback to generic messages for unknown errors
 * - Technical details in development mode
 * - Retry and navigation actions
 * - Error code display for support
 *
 * Note: Uses direct Spanish messages instead of i18n hook since this
 * component may be rendered outside of i18n context (in error boundaries).
 */

import { ERROR_CATALOG, isKnownErrorCode, type ErrorCode } from '@/lib/errors/error-catalog';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

// Direct translations (since error boundary may be outside i18n context)
const MESSAGES = {
  es: {
    'errors.auth.required': 'Debes iniciar sesión para acceder a este contenido',
    'errors.auth.invalidCredentials': 'Credenciales inválidas. Por favor, verifica tu email y contraseña',
    'errors.auth.sessionExpired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
    'errors.resource.notFound': 'Recurso no encontrado',
    'errors.resource.userNotFound': 'Usuario no encontrado. Verifica que la cuenta exista',
    'errors.settings.loadFailed': 'No pudimos cargar tu configuración. Por favor, recarga la página',
    'errors.database.generic': 'Error de base de datos. Estamos trabajando para solucionarlo',
    'errors.internal.unexpected': 'Ocurrió un error inesperado. Hemos registrado el problema',
    'common.errorCode': 'Código de error',
    'common.tryAgain': 'Intentar nuevamente',
    'common.goHome': 'Ir al inicio',
    'common.contactSupport': 'Si el problema persiste, contacta con soporte',
    'common.technicalDetails': 'Detalles técnicos (solo para desarrollo)',
    'title': '¡Ups! Algo salió mal',
  },
  en: {
    'errors.auth.required': 'You must be logged in to access this content',
    'errors.auth.invalidCredentials': 'Invalid credentials. Please check your email and password',
    'errors.auth.sessionExpired': 'Your session has expired. Please log in again',
    'errors.resource.notFound': 'Resource not found',
    'errors.resource.userNotFound': 'User not found. Please contact support if you believe this is an error.',
    'errors.settings.loadFailed': 'We couldn\'t load your settings. Please reload the page',
    'errors.database.generic': 'Database error. We\'re working to fix it',
    'errors.internal.unexpected': 'An unexpected error occurred. We\'ve logged the issue',
    'common.errorCode': 'Error code',
    'common.tryAgain': 'Try again',
    'common.goHome': 'Go to home',
    'common.contactSupport': 'If this problem persists, please contact support',
    'common.technicalDetails': 'Technical details (development only)',
    'title': 'Oops! Something went wrong',
  },
} as const;

// Detect user language from browser
function getUserLanguage(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('es') ? 'es' : 'en';
}

interface ErrorDisplayProps {
  error: Error & { code?: string; digest?: string };
  reset?: () => void;
  showTechnicalDetails?: boolean;
}

export default function ErrorDisplay({ error, reset, showTechnicalDetails = false }: ErrorDisplayProps) {
  // Determine error code
  const errorCode: ErrorCode | string = error.code || 'UNEXPECTED_ERROR';
  const isKnown = isKnownErrorCode(errorCode);

  // Get error metadata from catalog
  const errorMetadata = isKnown ? ERROR_CATALOG[errorCode] : null;

  // Detect user language from browser
  const lang = getUserLanguage();

  // Get translated message from MESSAGES constant
  const getMessage = (): string => {
    if (isKnown && errorMetadata) {
      const messageKey = errorMetadata.messageKey as string;
      return MESSAGES[lang][messageKey as keyof typeof MESSAGES['es']] || error.message || 'An unexpected error occurred';
    }
    return error.message || MESSAGES[lang]['errors.internal.unexpected'] || 'An unexpected error occurred';
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
          {MESSAGES[lang]['title']}
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
                {MESSAGES[lang]['common.errorCode']}: <span className="font-mono font-semibold">{errorCode}</span>
                {error.digest && ` (${error.digest})`}
              </p>
            </div>
          )}
        </div>

        {/* Technical Details (Dev Only) */}
        {(isDev || showTechnicalDetails) && error.message && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <h3 className="font-semibold text-red-800 mb-2 text-sm">
              {MESSAGES[lang]['common.technicalDetails']}
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
              {MESSAGES[lang]['common.tryAgain']}
            </button>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            {MESSAGES[lang]['common.goHome']}
          </button>
        </div>

        {/* Support Message */}
        <p className="mt-6 text-sm text-gray-500 text-center">
          {MESSAGES[lang]['common.contactSupport']}
        </p>
      </div>
    </div>
  );
}
