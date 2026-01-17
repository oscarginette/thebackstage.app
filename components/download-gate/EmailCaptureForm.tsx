
'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface EmailCaptureFormProps {
  onSubmit: (data: { email: string; firstName: string; consentMarketing: boolean }) => Promise<void>;
}

export function EmailCaptureForm({ onSubmit }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(true);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !firstName) return;

    setLoading(true);
    setShowToast(false); // Hide previous toast

    try {
      await onSubmit({ email, firstName, consentMarketing });
      // Success handled by parent component (shows success state)
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to submit. Please try again.';

      setToastMessage(errorMessage);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <h2 className="text-sm font-black uppercase tracking-widest mb-6">Please support the artist to unlock your download</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-xs font-bold mb-2 uppercase tracking-tight">First name</label>
          <input
            id="firstName"
            type="text"
            required
            placeholder="Your name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm h-10"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold mb-2 uppercase tracking-tight">Email address</label>
          <input
            id="email"
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white focus:ring-1 focus:ring-accent outline-none transition-all text-sm h-10"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !firstName}
          className="w-full bg-[#ff3300] text-sm text-white py-3 rounded-lg font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Share email address"
          )}
        </button>

        <p className="text-[10px] text-foreground/50 leading-relaxed mt-6">
          By providing your email address, you agree that your email address will be shared with the author of this download and that you may receive emails from the author and The Backstage. You can withdraw this consent from The Backstage or the author of this content by unsubscribing from any emails received. For more information see our Privacy Policy <a href="#" className="underline">here</a>.
        </p>
      </form>

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </motion.div>
  );
}
