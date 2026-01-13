'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import EnterDomainStep from './EnterDomainStep';
import ConfigureDNSStep from './ConfigureDNSStep';
import VerifyingStep from './VerifyingStep';
import CompleteStep from './CompleteStep';
import type { SendingDomain } from '@/domain/entities/SendingDomain';
import type { DNSRecords } from '@/domain/entities/SendingDomain';

type Step = 'enter-domain' | 'configure-dns' | 'verifying' | 'complete';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (domain: ReturnType<SendingDomain['toJSON']>) => void;
}

/**
 * AddDomainModal Component
 *
 * Multi-step wizard for adding and verifying a new sending domain.
 *
 * Steps:
 * 1. Enter domain name
 * 2. Configure DNS records (display instructions)
 * 3. Verifying (loading state)
 * 4. Complete (success/failure)
 *
 * Architecture:
 * - SRP: Only handles modal flow and step orchestration
 * - Delegates rendering to step components
 * - Uses Clean Architecture (API calls via endpoints)
 */
export default function AddDomainModal({ isOpen, onClose, onSuccess }: AddDomainModalProps) {
  const [step, setStep] = useState<Step>('enter-domain');
  const [domain, setDomain] = useState('');
  const [domainData, setDomainData] = useState<ReturnType<SendingDomain['toJSON']> | null>(null);
  const [dnsRecords, setDNSRecords] = useState<DNSRecords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    // Reset state on close
    setStep('enter-domain');
    setDomain('');
    setDomainData(null);
    setDNSRecords(null);
    setError(null);
    onClose();
  };

  const handleDomainSubmit = async (domainName: string) => {
    setDomain(domainName);
    setError(null);

    try {
      const res = await fetch('/api/sending-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainName }),
      });

      const data = await res.json();

      if (res.ok && data.domain && data.dnsRecords) {
        setDomainData(data.domain);
        setDNSRecords(data.dnsRecords);
        setStep('configure-dns');
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (err) {
      console.error('Add domain error:', err);
      setError('Failed to add domain. Please try again.');
    }
  };

  const handleVerifyDomain = async () => {
    if (!domainData) return;

    setStep('verifying');
    setError(null);

    try {
      const res = await fetch(`/api/sending-domains/${domainData.id}/verify`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.domain) {
        setDomainData(data.domain);
        setStep('complete');

        // If verified, call success callback after 2 seconds
        if (data.domain.status === 'verified') {
          setTimeout(() => {
            onSuccess(data.domain);
            handleClose();
          }, 2000);
        }
      } else {
        setError(data.error || 'Verification failed');
        setStep('complete');
      }
    } catch (err) {
      console.error('Verify domain error:', err);
      setError('Failed to verify domain. Please try again.');
      setStep('complete');
    }
  };

  const handleRetry = () => {
    setStep('configure-dns');
    setError(null);
  };

  const handleFinish = () => {
    if (domainData) {
      onSuccess(domainData);
    }
    handleClose();
  };

  const getStepIndex = () => {
    switch (step) {
      case 'enter-domain':
        return 0;
      case 'configure-dns':
        return 1;
      case 'verifying':
        return 2;
      case 'complete':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      hideDefaultHeader
      closeOnBackdropClick={step === 'enter-domain' || step === 'complete'}
    >
      {/* Custom Header with Progress */}
      <div className="p-6 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif text-foreground">Add Sending Domain</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground/60 hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          {['Enter domain', 'Configure DNS', 'Verify'].map((label, index) => (
            <div key={label} className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= getStepIndex()
                      ? 'bg-accent'
                      : 'bg-black/10 dark:bg-white/10'
                  }`}
                />
              </div>
              <p
                className={`text-[10px] font-bold mt-1 transition-colors ${
                  index <= getStepIndex()
                    ? 'text-foreground'
                    : 'text-foreground/40'
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 'enter-domain' && (
            <motion.div
              key="enter-domain"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <EnterDomainStep
                onSubmit={handleDomainSubmit}
                error={error}
              />
            </motion.div>
          )}

          {step === 'configure-dns' && dnsRecords && (
            <motion.div
              key="configure-dns"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ConfigureDNSStep
                domain={domain}
                dnsRecords={dnsRecords}
                onVerify={handleVerifyDomain}
                onBack={() => setStep('enter-domain')}
              />
            </motion.div>
          )}

          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <VerifyingStep domain={domain} />
            </motion.div>
          )}

          {step === 'complete' && domainData && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CompleteStep
                domain={domainData}
                error={error}
                onRetry={handleRetry}
                onFinish={handleFinish}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
