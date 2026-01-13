'use client';

import { RefreshCw } from 'lucide-react';

interface VerifyingStepProps {
  domain: string;
}

/**
 * VerifyingStep Component
 *
 * Step 3: Loading state while verifying domain.
 *
 * Features:
 * - Loading spinner
 * - Informative message
 */
export default function VerifyingStep({ domain }: VerifyingStepProps) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-accent animate-spin" />
      </div>

      <h3 className="text-lg font-serif text-foreground mb-2">
        Verifying {domain}
      </h3>
      <p className="text-sm text-foreground/60 mb-6">
        Checking DNS records and domain configuration...
      </p>

      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          This may take a few seconds. Please wait...
        </p>
      </div>
    </div>
  );
}
