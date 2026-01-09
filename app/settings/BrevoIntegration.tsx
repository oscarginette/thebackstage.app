"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Link as LinkIcon,
  Unlink,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface BrevoIntegrationProps {
  userId: string;
}

interface BrevoStatus {
  connected: boolean;
  integration?: {
    id: number;
    accountEmail: string;
    accountName: string;
    companyName: string | null;
    connectedAt: string;
    lastSyncAt: string | null;
    lastError: string | null;
    stats: {
      contactsFromBrevo: number;
      totalImports: number;
      lastSuccessfulImport: string | null;
    };
  };
}

interface ImportResult {
  contactsFetched: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  listsProcessed: number;
  duration: number;
  hasErrors: boolean;
  errors?: string[];
}

export default function BrevoIntegration({ userId }: BrevoIntegrationProps) {
  const [status, setStatus] = useState<BrevoStatus>({ connected: false });
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch initial status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/brevo/status');

      if (!response.ok) {
        throw new Error('Failed to fetch Brevo status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error('Error fetching Brevo status:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Brevo API key');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/integrations/brevo/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Brevo');
      }

      setSuccess(`Connected successfully to ${data.integration.accountEmail}`);
      setApiKey(''); // Clear API key input for security
      await fetchStatus(); // Refresh status

    } catch (err: any) {
      console.error('Error connecting Brevo:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Brevo account? You can reconnect at any time.')) {
      return;
    }

    try {
      setIsDisconnecting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/integrations/brevo/disconnect', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Brevo');
      }

      setSuccess('Brevo account disconnected successfully');
      await fetchStatus(); // Refresh status

    } catch (err: any) {
      console.error('Error disconnecting Brevo:', err);
      setError(err.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('This will import all contacts from your Brevo account. This may take several minutes. Continue?')) {
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setSuccess(null);
      setImportResult(null);

      const response = await fetch('/api/integrations/brevo/import', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import contacts');
      }

      setImportResult(data.import);
      setSuccess(`Successfully imported ${data.import.contactsInserted} new contacts and updated ${data.import.contactsUpdated} existing contacts`);
      await fetchStatus(); // Refresh stats

    } catch (err: any) {
      console.error('Error importing contacts:', err);
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl p-6 shadow-sm flex items-center justify-center h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      {/* Header - Always Visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-[#0B996E]" />
          <div className="text-left">
            <h2 className="text-base font-serif">Brevo Integration</h2>
            <p className="text-foreground/50 text-xs">
              {status.connected
                ? `Connected • ${status.integration?.stats.contactsFromBrevo || 0} contacts`
                : 'Import your contacts from Brevo'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.connected && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-foreground/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground/40" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-4 border-t border-white/40 dark:border-white/10">

      {/* Error/Success Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not Connected State */}
      {!status.connected && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                Brevo API Key
              </label>
              <button
                type="button"
                onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
                className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0B996E] hover:text-[#0a8c64] transition-colors uppercase tracking-widest"
              >
                <Info className="w-3 h-3" />
                How to get
                {showApiKeyHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xkeysib-••••••••••••••••••••••••••••••"
              className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#0B996E]/20 focus:border-[#0B996E]/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium font-mono text-foreground"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
          </div>

          {/* API Key Help */}
          <AnimatePresence>
            {showApiKeyHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#0B996E]/5 to-[#0B996E]/10 border border-[#0B996E]/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-foreground mb-3">
                    How to get your Brevo API Key:
                  </h4>
                  <ol className="space-y-2 text-xs text-foreground/70">
                    <li className="flex gap-2">
                      <span className="font-bold text-[#0B996E]">1.</span>
                      <span>
                        Go to{" "}
                        <a
                          href="https://app.brevo.com/settings/keys/api"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0B996E] hover:underline inline-flex items-center gap-1"
                        >
                          Brevo API Settings
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-[#0B996E]">2.</span>
                      <span>Click "Generate a new API key"</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-[#0B996E]">3.</span>
                      <span>Copy the key (starts with "xkeysib-")</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-[#0B996E]">4.</span>
                      <span>Paste it above and click "Connect"</span>
                    </li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || !apiKey.trim()}
            className="w-full h-10 px-4 rounded-xl bg-[#0B996E] text-white text-xs font-bold hover:bg-[#0a8c64] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                Connect Brevo Account
              </>
            )}
          </button>
        </div>
      )}

      {/* Connected State */}
      {status.connected && status.integration && (
        <div className="space-y-4">
          {/* Account Info */}
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-500/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {status.integration.accountName}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {status.integration.accountEmail}
                  </p>
                  {status.integration.companyName && (
                    <p className="text-[10px] text-foreground/40 mt-1">
                      {status.integration.companyName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Unlink className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 dark:bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">
                {status.integration.stats.contactsFromBrevo}
              </p>
              <p className="text-[9px] text-foreground/50 font-medium uppercase tracking-wider">
                Contacts
              </p>
            </div>
            <div className="bg-white/60 dark:bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">
                {status.integration.stats.totalImports}
              </p>
              <p className="text-[9px] text-foreground/50 font-medium uppercase tracking-wider">
                Imports
              </p>
            </div>
            <div className="bg-white/60 dark:bg-[#111] rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">
                {status.integration.stats.lastSuccessfulImport
                  ? new Date(status.integration.stats.lastSuccessfulImport).toLocaleDateString()
                  : 'Never'}
              </p>
              <p className="text-[9px] text-foreground/50 font-medium uppercase tracking-wider">
                Last Sync
              </p>
            </div>
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting}
            className="w-full h-10 px-4 rounded-xl bg-foreground text-background text-xs font-bold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing contacts...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Import Contacts from Brevo
              </>
            )}
          </button>

          {/* Import Result */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 rounded-xl p-4 space-y-2"
            >
              <p className="text-xs font-bold text-foreground">Import Summary:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-foreground/50">Fetched:</span>
                  <span className="ml-2 font-bold">{importResult.contactsFetched}</span>
                </div>
                <div>
                  <span className="text-foreground/50">Lists:</span>
                  <span className="ml-2 font-bold">{importResult.listsProcessed}</span>
                </div>
                <div>
                  <span className="text-emerald-600">New:</span>
                  <span className="ml-2 font-bold text-emerald-600">{importResult.contactsInserted}</span>
                </div>
                <div>
                  <span className="text-blue-600">Updated:</span>
                  <span className="ml-2 font-bold text-blue-600">{importResult.contactsUpdated}</span>
                </div>
              </div>
              <p className="text-[10px] text-foreground/40">
                Duration: {(importResult.duration / 1000).toFixed(2)}s
              </p>
            </motion.div>
          )}
        </div>
      )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
