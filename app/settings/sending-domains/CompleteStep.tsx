'use client';

import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { DOMAIN_STATUS } from '@/domain/entities/SendingDomain';
import type { SendingDomain } from '@/domain/entities/SendingDomain';

interface CompleteStepProps {
  domain: ReturnType<SendingDomain['toJSON']>;
  error: string | null;
  onRetry: () => void;
  onFinish: () => void;
}

/**
 * CompleteStep Component
 *
 * Step 4: Display verification result (success or failure).
 *
 * Features:
 * - Success state (verified)
 * - Failure state (with error message)
 * - Retry action
 * - Finish action
 */
export default function CompleteStep({ domain, error, onRetry, onFinish }: CompleteStepProps) {
  const isVerified = domain.status === DOMAIN_STATUS.VERIFIED;
  const isFailed = domain.status === DOMAIN_STATUS.FAILED || error;

  if (isVerified) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h3 className="text-lg font-serif text-foreground mb-2">
          Domain Verified Successfully!
        </h3>
        <p className="text-sm text-foreground/60 mb-6">
          <strong>{domain.domain}</strong> is now verified and ready to send emails.
        </p>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 mb-6">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            You can now send emails from addresses like info@{domain.domain}
          </p>
        </div>

        <button
          onClick={onFinish}
          className="w-full h-12 rounded-lg bg-foreground text-background text-sm font-bold hover:bg-foreground/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Done
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-lg font-serif text-foreground mb-2">
          Verification Failed
        </h3>
        <p className="text-sm text-foreground/60 mb-6">
          We couldn't verify <strong>{domain.domain}</strong> at this time.
        </p>

        {/* Error Message */}
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 mb-6">
          <div className="flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                Error Details:
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">
                {error || domain.errorMessage || 'DNS records not found or invalid.'}
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 text-left mb-6">
          <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
            Troubleshooting Tips:
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-500 space-y-1 list-disc list-inside">
            <li>Wait 5-10 minutes for DNS changes to propagate</li>
            <li>Verify DNS records are added exactly as shown</li>
            <li>Check for typos in record names or values</li>
            <li>Some DNS providers require 24-48 hours for full propagation</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 h-12 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={onFinish}
            className="h-12 px-6 rounded-lg border border-border/60 text-foreground text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Partial verification (dns_configured but not verified)
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
      </div>

      <h3 className="text-lg font-serif text-foreground mb-2">
        Domain Added
      </h3>
      <p className="text-sm text-foreground/60 mb-6">
        <strong>{domain.domain}</strong> has been added but needs DNS configuration.
      </p>

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 mb-6">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Complete DNS configuration and verify to start sending emails.
        </p>
      </div>

      <button
        onClick={onFinish}
        className="w-full h-12 rounded-lg bg-foreground text-background text-sm font-bold hover:bg-foreground/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        Done
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
