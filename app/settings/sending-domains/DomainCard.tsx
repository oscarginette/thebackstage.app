'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DOMAIN_STATUS, type DomainStatus } from '@/domain/entities/SendingDomain';
import type { SendingDomain } from '@/domain/entities/SendingDomain';

interface DomainCardProps {
  domain: ReturnType<SendingDomain['toJSON']>;
  onUpdate: (domain: ReturnType<SendingDomain['toJSON']>) => void;
  onDelete: (domainId: number) => void;
}

/**
 * DomainCard Component
 *
 * Displays a single sending domain with status, DNS records, and actions.
 *
 * Features:
 * - Status badges (pending, dns_configured, verified, failed)
 * - DNS records display (collapsible)
 * - Copy-to-clipboard for DNS values
 * - Verify action
 * - Delete action with confirmation
 * - Error message display
 *
 * Architecture:
 * - SRP: Only handles single domain presentation
 * - Uses typed constants (DOMAIN_STATUS)
 */
export default function DomainCard({ domain, onUpdate, onDelete }: DomainCardProps) {
  const [showDNS, setShowDNS] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/sending-domains/${domain.id}/verify`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.domain) {
        onUpdate(data.domain);
      } else {
        alert(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify domain. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sending-domains/${domain.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete(domain.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete domain. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const getStatusBadge = (status: DomainStatus) => {
    switch (status) {
      case DOMAIN_STATUS.VERIFIED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case DOMAIN_STATUS.DNS_CONFIGURED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            DNS Configured
          </span>
        );
      case DOMAIN_STATUS.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case DOMAIN_STATUS.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif text-foreground mb-2">{domain.domain}</h3>
          <div className="flex items-center gap-3">
            {getStatusBadge(domain.status)}
            {domain.verifiedAt && (
              <p className="text-xs text-foreground/50">
                Verified {new Date(domain.verifiedAt).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {domain.canVerify && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="h-9 px-4 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Verify
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="h-9 px-4 rounded-lg border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {domain.errorMessage && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                Verification Failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">
                {domain.errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DNS Records Toggle */}
      {domain.dnsRecords && (
        <>
          <button
            onClick={() => setShowDNS(!showDNS)}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-bold text-foreground">
              DNS Configuration
            </span>
            {showDNS ? (
              <ChevronUp className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60" />
            )}
          </button>

          <AnimatePresence>
            {showDNS && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {/* SPF Record */}
                <DNSRecordRow
                  label="SPF"
                  type="TXT"
                  name={domain.dnsRecords.spf.name}
                  value={domain.dnsRecords.spf.value}
                  copied={copiedField === 'spf'}
                  onCopy={() => handleCopy('spf', domain.dnsRecords!.spf.value)}
                />

                {/* DKIM Record */}
                <DNSRecordRow
                  label="DKIM"
                  type="TXT"
                  name={domain.dnsRecords.dkim.name}
                  value={domain.dnsRecords.dkim.value}
                  copied={copiedField === 'dkim'}
                  onCopy={() => handleCopy('dkim', domain.dnsRecords!.dkim.value)}
                />

                {/* DMARC Record */}
                <DNSRecordRow
                  label="DMARC"
                  type="TXT"
                  name={domain.dnsRecords.dmarc.name}
                  value={domain.dnsRecords.dmarc.value}
                  copied={copiedField === 'dmarc'}
                  onCopy={() => handleCopy('dmarc', domain.dnsRecords!.dmarc.value)}
                />

                {/* Tracking CNAME (optional) */}
                {domain.dnsRecords.tracking && (
                  <DNSRecordRow
                    label="Tracking"
                    type="CNAME"
                    name={domain.dnsRecords.tracking.name}
                    value={domain.dnsRecords.tracking.value}
                    copied={copiedField === 'tracking'}
                    onCopy={() => handleCopy('tracking', domain.dnsRecords!.tracking!.value)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-xl max-w-sm mx-4 border border-white/80 dark:border-white/10"
            >
              <h3 className="text-lg font-serif text-foreground mb-2">
                Delete domain?
              </h3>
              <p className="text-sm text-foreground/60 mb-6">
                Are you sure you want to delete <strong>{domain.domain}</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="h-10 px-6 rounded-lg border border-border/60 text-foreground text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-10 px-6 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * DNSRecordRow Component
 *
 * Displays a single DNS record with copy functionality.
 */
function DNSRecordRow({
  label,
  type,
  name,
  value,
  copied,
  onCopy,
}: {
  label: string;
  type: string;
  name: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground/40">
          {label} Record
        </span>
        <span className="text-xs font-mono text-foreground/60 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
          {type}
        </span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-bold text-foreground/50 mb-1">Name</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-foreground bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 overflow-x-auto">
              {name}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(name)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Copy name"
            >
              <Copy className="w-4 h-4 text-foreground/60" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground/50 mb-1">Value</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-foreground bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 overflow-x-auto break-all">
              {value}
            </code>
            <button
              onClick={onCopy}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Copy value"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-foreground/60" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
