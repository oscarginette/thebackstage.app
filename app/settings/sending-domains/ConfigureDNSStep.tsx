'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, ArrowRight, ChevronLeft } from 'lucide-react';
import type { DNSRecords } from '@/domain/entities/SendingDomain';

interface ConfigureDNSStepProps {
  domain: string;
  dnsRecords: DNSRecords;
  onVerify: () => void;
  onBack: () => void;
}

/**
 * ConfigureDNSStep Component
 *
 * Step 2: Display DNS records with copy-to-clipboard functionality.
 *
 * Features:
 * - Display SPF, DKIM, DMARC, Tracking records
 * - Copy-to-clipboard for each record
 * - Instructions for DNS configuration
 * - Link to DNS provider help
 */
export default function ConfigureDNSStep({ domain, dnsRecords, onVerify, onBack }: ConfigureDNSStepProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-lg font-serif text-foreground mb-2">
          Configure DNS Records
        </h3>
        <p className="text-sm text-foreground/60">
          Add these DNS records to <strong>{domain}</strong> in your DNS provider
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20">
        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
          How to add DNS records:
        </h4>
        <ol className="text-xs text-blue-600 dark:text-blue-500 space-y-1 list-decimal list-inside">
          <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
          <li>Navigate to DNS settings or DNS management</li>
          <li>Add each record below exactly as shown</li>
          <li>Wait 5-10 minutes for DNS propagation</li>
          <li>Click "Verify Domain" below to complete setup</li>
        </ol>
        <a
          href="https://www.mailgun.com/blog/deliverability/which-dns-record-to-use-for-email/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Learn more about DNS records
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* DNS Records */}
      <div className="space-y-4 mb-6">
        {/* SPF Record */}
        <DNSRecordCard
          label="SPF Record"
          description="Sender Policy Framework - Authorizes Mailgun to send on your behalf"
          type="TXT"
          name={dnsRecords.spf.name}
          value={dnsRecords.spf.value}
          copied={copiedField === 'spf-name' || copiedField === 'spf-value'}
          onCopyName={() => handleCopy('spf-name', dnsRecords.spf.name)}
          onCopyValue={() => handleCopy('spf-value', dnsRecords.spf.value)}
        />

        {/* DKIM Record */}
        <DNSRecordCard
          label="DKIM Record"
          description="DomainKeys Identified Mail - Signs your emails with a cryptographic signature"
          type="TXT"
          name={dnsRecords.dkim.name}
          value={dnsRecords.dkim.value}
          copied={copiedField === 'dkim-name' || copiedField === 'dkim-value'}
          onCopyName={() => handleCopy('dkim-name', dnsRecords.dkim.name)}
          onCopyValue={() => handleCopy('dkim-value', dnsRecords.dkim.value)}
        />

        {/* DMARC Record */}
        <DNSRecordCard
          label="DMARC Record"
          description="Domain-based Message Authentication - Tells receivers what to do with unauthenticated emails"
          type="TXT"
          name={dnsRecords.dmarc.name}
          value={dnsRecords.dmarc.value}
          copied={copiedField === 'dmarc-name' || copiedField === 'dmarc-value'}
          onCopyName={() => handleCopy('dmarc-name', dnsRecords.dmarc.name)}
          onCopyValue={() => handleCopy('dmarc-value', dnsRecords.dmarc.value)}
        />

        {/* Tracking CNAME (optional) */}
        {dnsRecords.tracking && (
          <DNSRecordCard
            label="Tracking Record (Optional)"
            description="Enables click and open tracking for your emails"
            type="CNAME"
            name={dnsRecords.tracking.name}
            value={dnsRecords.tracking.value}
            copied={copiedField === 'tracking-name' || copiedField === 'tracking-value'}
            onCopyName={() => handleCopy('tracking-name', dnsRecords.tracking!.name)}
            onCopyValue={() => handleCopy('tracking-value', dnsRecords.tracking!.value)}
            optional
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="h-12 px-6 rounded-lg border border-border/60 text-foreground text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onVerify}
          className="flex-1 h-12 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Verify Domain
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Important:</strong> DNS changes can take 5-60 minutes to propagate. If verification fails, wait a few minutes and try again.
        </p>
      </div>
    </div>
  );
}

/**
 * DNSRecordCard Component
 *
 * Displays a single DNS record with copy buttons.
 */
function DNSRecordCard({
  label,
  description,
  type,
  name,
  value,
  copied,
  onCopyName,
  onCopyValue,
  optional = false,
}: {
  label: string;
  description: string;
  type: string;
  name: string;
  value: string;
  copied: boolean;
  onCopyName: () => void;
  onCopyValue: () => void;
  optional?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            {label}
            {optional && (
              <span className="text-[10px] font-medium text-foreground/50 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                Optional
              </span>
            )}
          </h4>
          <p className="text-xs text-foreground/60 mt-1">{description}</p>
        </div>
        <span className="text-xs font-mono text-foreground/60 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
          {type}
        </span>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 mb-1.5 block">
            Name / Host
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-foreground bg-black/[0.02] dark:bg-white/[0.02] px-3 py-2 rounded-lg border border-black/5 dark:border-white/5 overflow-x-auto">
              {name}
            </code>
            <button
              onClick={onCopyName}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Copy name"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-foreground/60" />
              )}
            </button>
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 mb-1.5 block">
            Value / Points to
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-foreground bg-black/[0.02] dark:bg-white/[0.02] px-3 py-2 rounded-lg border border-black/5 dark:border-white/5 overflow-x-auto break-all max-h-24">
              {value}
            </code>
            <button
              onClick={onCopyValue}
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
