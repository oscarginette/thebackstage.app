'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATHS } from '@/lib/paths';
import AddDomainModal from './AddDomainModal';
import DomainCard from './DomainCard';
import type { SendingDomain } from '@/domain/entities/SendingDomain';

interface SendingDomainsClientProps {
  initialDomains: ReturnType<SendingDomain['toJSON']>[];
}

/**
 * SendingDomainsClient Component
 *
 * Main client component for managing sending domains.
 * Displays list of domains and handles add/verify/delete actions.
 *
 * Features:
 * - Add domain modal (multi-step wizard)
 * - Domain list with status badges
 * - Verify and delete actions
 * - Empty state when no domains
 * - Real-time updates via state management
 *
 * Architecture:
 * - SRP: Only handles domain list presentation and user actions
 * - Delegates to child components (DomainCard, AddDomainModal)
 * - Uses Clean Architecture (API calls via endpoints)
 */
export default function SendingDomainsClient({ initialDomains }: SendingDomainsClientProps) {
  const [domains, setDomains] = useState(initialDomains);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDomainAdded = (newDomain: ReturnType<SendingDomain['toJSON']>) => {
    setDomains([newDomain, ...domains]);
    setShowAddModal(false);
  };

  const handleDomainUpdated = (updatedDomain: ReturnType<SendingDomain['toJSON']>) => {
    setDomains(domains.map(d => d.id === updatedDomain.id ? updatedDomain : d));
  };

  const handleDomainDeleted = (domainId: number) => {
    setDomains(domains.filter(d => d.id !== domainId));
  };

  return (
    <div className="min-h-screen h-screen relative flex flex-col bg-background selection:bg-accent/30 selection:text-foreground overflow-hidden">
      {/* Background Aurora Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-aurora-light dark:bg-aurora-dark opacity-30 dark:opacity-100 blur-[120px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-accent/5 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header Navigation */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex items-center justify-between">
        <Link
          href={PATHS.SETTINGS}
          className="group inline-flex items-center gap-2 text-sm font-bold text-foreground/40 hover:text-foreground transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md group-hover:border-accent group-hover:bg-accent/5 transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="hidden sm:inline uppercase tracking-widest text-[9px]">Back to Settings</span>
        </Link>

        <div className="font-serif italic text-xl text-foreground/80">
          Sending Domains
        </div>

        <div className="w-8 h-8" />
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 flex-1 flex flex-col overflow-y-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif text-foreground mb-1">
                  Senders, Domains & Dedicated IPs
                </h1>
                <p className="text-sm text-foreground/60">
                  Verify your domain to send emails from your own address
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add domain
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-black/5 dark:border-white/10">
              <button className="px-6 py-3 text-sm font-bold text-foreground border-b-2 border-accent bg-accent/5">
                Domains
              </button>
              <button className="px-6 py-3 text-sm font-medium text-foreground/40 hover:text-foreground/60 transition-colors cursor-not-allowed" disabled>
                Senders
              </button>
              <button className="px-6 py-3 text-sm font-medium text-foreground/40 hover:text-foreground/60 transition-colors cursor-not-allowed" disabled>
                Dedicated IPs
              </button>
            </div>

            {/* Domain List */}
            <div className="p-6">
              {domains.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-accent/60" />
                  </div>
                  <h3 className="text-lg font-serif text-foreground mb-2">
                    No domains added yet
                  </h3>
                  <p className="text-sm text-foreground/60 mb-6">
                    Add your first domain to start sending emails from your own address
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add your first domain
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {domains.map((domain, index) => (
                      <motion.div
                        key={domain.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <DomainCard
                          domain={domain}
                          onUpdate={handleDomainUpdated}
                          onDelete={handleDomainDeleted}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleDomainAdded}
      />
    </div>
  );
}
