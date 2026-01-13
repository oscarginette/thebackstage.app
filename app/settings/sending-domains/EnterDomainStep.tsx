'use client';

import { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface EnterDomainStepProps {
  onSubmit: (domain: string) => Promise<void>;
  error: string | null;
}

/**
 * EnterDomainStep Component
 *
 * Step 1: Enter domain name with client-side validation.
 *
 * Features:
 * - Domain format validation
 * - Error display
 * - Loading state
 */
export default function EnterDomainStep({ onSubmit, error }: EnterDomainStepProps) {
  const [domain, setDomain] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateDomain = (value: string): boolean => {
    if (!value) {
      setValidationError('Domain is required');
      return false;
    }

    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(value)) {
      setValidationError('Please enter a valid domain (e.g., example.com)');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDomain = domain.trim().toLowerCase();

    if (!validateDomain(trimmedDomain)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedDomain);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDomain(value);
    setValidationError(null);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-lg font-serif text-foreground mb-2">
          Enter your domain name
        </h3>
        <p className="text-sm text-foreground/60">
          Add the domain you want to send emails from (e.g., geebeat.com)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Domain Name"
          type="text"
          value={domain}
          onChange={handleDomainChange}
          placeholder="example.com"
          error={validationError || undefined}
          disabled={isSubmitting}
          autoFocus
          helperText="Do not include 'http://' or 'www'"
        />

        {/* API Error Display */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                  Failed to add domain
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <strong>Note:</strong> You'll need access to your domain's DNS settings to complete verification.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !domain.trim()}
          className="w-full h-12 rounded-lg bg-foreground text-background text-sm font-bold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
              Adding domain...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
