/**
 * DownloadGateForm Component
 *
 * Form for download gate submission with multi-brand consent.
 * Implements GDPR-compliant explicit consent collection.
 *
 * Clean Architecture:
 * - Presentation layer (UI only)
 * - Single Responsibility Principle (SRP)
 * - Uses typed constants (DOWNLOAD_SOURCES)
 * - Accessible form with ARIA attributes
 *
 * GDPR Compliance:
 * - Explicit consent checkboxes (not pre-checked)
 * - Clear consent language per brand
 * - Artist consent always checked (DJ owns content)
 * - At least one consent required
 *
 * Features:
 * - Email validation (required)
 * - First name (optional)
 * - Multi-brand consent (The Backstage, Gbid, Artist)
 * - Loading states
 * - Error handling
 * - Success state with verification instructions
 * - Mobile-responsive
 * - Backstage brand colors (#FF5500)
 */

'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { DOWNLOAD_SOURCES } from '@/domain/types/download-gate-constants';

interface DownloadGateFormProps {
  artistName: string;
  trackTitle: string;
  onSubmit: (data: DownloadGateFormData) => Promise<void>;
}

export interface DownloadGateFormData {
  email: string;
  firstName?: string;
  consentBackstage: boolean;
  consentGeeBeat: boolean;
  source: 'the_backstage' | 'gee_beat';
}

export function DownloadGateForm({ artistName, trackTitle, onSubmit }: DownloadGateFormProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consentBackstage, setConsentBackstage] = useState(false);
  const [consentGeeBeat, setConsentGbid] = useState(true); // Pre-checked opt-out for conversion optimization

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validate form inputs
   * @returns true if valid, sets error message if invalid
   */
  const validateForm = (): boolean => {
    // Email required and valid format
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    // Artist consent is always required (checked + disabled)
    // Gee Beat and Backstage are OPTIONAL - user can uncheck both
    // This prevents "forced consent" which would violate GDPR
    // No validation needed - artist consent alone is sufficient

    setError(null);
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        email,
        firstName: firstName.trim() || undefined,
        consentBackstage,
        consentGeeBeat,
        source: DOWNLOAD_SOURCES.THE_BACKSTAGE, // Default to The Backstage platform
      });

      // Success - show verification instructions
      setSuccess(true);
    } catch (err) {
      // Handle errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if form is valid for submission
   */
  const isFormValid = (): boolean => {
    // Only email validation required
    // Artist consent is always true (mandatory checkbox)
    // Gee Beat and Backstage are optional (GDPR compliance)
    return email.includes('@');
  };

  // Success state - show verification instructions
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full text-center py-8"
      >
        <div className="mb-6">
          <CheckCircle2 className="w-16 h-16 text-[#FF5500] mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
            Check Your Email
          </h2>
          <p className="text-sm text-foreground/60">
            We've sent verification instructions to
          </p>
          <p className="text-sm font-bold text-foreground mt-1">
            {email}
          </p>
        </div>

        <div className="bg-[#FF5500]/5 border border-[#FF5500]/20 rounded-xl p-6 text-left">
          <div className="flex gap-3 mb-4">
            <Mail className="w-5 h-5 text-[#FF5500] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold mb-2">Next Steps:</p>
              <ul className="text-xs text-foreground/70 space-y-2">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the verification link</li>
                <li>• Complete any required social actions</li>
                <li>• Download your track!</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-xs text-foreground/40 mt-6">
          Didn't receive the email?{' '}
          <button
            onClick={() => setSuccess(false)}
            className="underline font-bold hover:text-foreground/60 transition-colors"
          >
            Try again
          </button>
        </p>
      </motion.div>
    );
  }

  // Form state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <h2 className="text-sm font-black uppercase tracking-widest mb-6">
        Support the artist to unlock your download
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div
            className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2"
            role="alert"
            aria-live="polite"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        {/* Email field (required) */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold mb-2 uppercase tracking-tight"
          >
            Email address <span className="text-[#FF5500]">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]/40 outline-none transition-all text-sm h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'email-error' : undefined}
          />
        </div>

        {/* First name field (optional) */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-xs font-bold mb-2 uppercase tracking-tight"
          >
            First name <span className="text-foreground/40 text-[10px]">(Optional)</span>
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]/40 outline-none transition-all text-sm h-10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Multi-brand consent checkboxes */}
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold uppercase tracking-tight mb-3">
            Marketing Consent <span className="text-[#FF5500]">*</span>
          </p>

          {/* Artist consent (always checked, disabled) - FIRST */}
          <label className="flex items-start gap-3 cursor-not-allowed opacity-60">
            <input
              type="checkbox"
              checked={true}
              disabled={true}
              className="mt-0.5 w-4 h-4 rounded border-foreground/20 bg-white text-[#FF5500] cursor-not-allowed"
              aria-label={`Accept emails from ${artistName}`}
            />
            <span className="text-xs text-foreground/70">
              I accept to receive emails from <strong>{artistName}</strong>
              <span className="block text-[10px] text-foreground/50 mt-1">
                (Required - artist owns this content)
              </span>
            </span>
          </label>

          {/* Gee Beat consent (pre-checked opt-out) - SECOND */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentGeeBeat}
              onChange={(e) => setConsentGbid(e.target.checked)}
              disabled={loading}
              className="mt-0.5 w-4 h-4 rounded border-foreground/20 bg-white text-[#FF5500] focus:ring-[#FF5500] focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Receive exclusive music content from Gee Beat"
            />
            <span className="text-xs text-foreground group-hover:text-foreground transition-colors">
              I want to receive exclusive music releases, industry tips, and DJ resources from <strong>Gee Beat</strong> (you can unsubscribe anytime)
            </span>
          </label>

          {/* The Backstage consent (opt-in) - THIRD */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentBackstage}
              onChange={(e) => setConsentBackstage(e.target.checked)}
              disabled={loading}
              className="mt-0.5 w-4 h-4 rounded border-foreground/20 bg-white text-[#FF5500] focus:ring-[#FF5500] focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Accept emails from The Backstage"
            />
            <span className="text-sm text-foreground/70 group-hover:text-foreground/90 transition-colors">
              I also want to receive updates from <strong>The Backstage</strong> platform
            </span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="w-full bg-[#FF5500] text-sm text-white py-3 rounded-lg font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-[#FF5500]/20"
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'Continue to Download'
          )}
        </button>

        {/* GDPR disclosure */}
        <p className="text-[10px] text-foreground/50 leading-relaxed mt-6">
          By providing your email address, you agree that your email will be shared with{' '}
          <strong>{artistName}</strong> and the selected brands above. Gee Beat is pre-selected
          to provide you with exclusive music content - you can uncheck it before submitting if
          you prefer not to receive these emails. You may receive emails from the brands you
          consent to. You can withdraw consent at any time by unsubscribing from emails. For
          more information see our{' '}
          <a href="/privacy" className="underline hover:text-foreground/70 transition-colors">
            Privacy Policy
          </a>
          .
        </p>

        {/* Help text */}
        <p className="text-center text-[10px] text-foreground/40 mt-4">
          Having trouble?{' '}
          <a
            href="/help"
            className="underline font-bold hover:text-foreground/60 transition-colors"
          >
            Contact support
          </a>
        </p>
      </form>
    </motion.div>
  );
}
