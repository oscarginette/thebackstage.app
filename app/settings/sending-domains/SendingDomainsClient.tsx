'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { LAYOUT_STYLES } from '@/domain/types/design-tokens';
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
    <div className={LAYOUT_STYLES.spacing.section}>
      {/* Header Section */}
      <SettingsPageHeader
        title="Senders, Domains & Dedicated IPs"
        description="Verify your domain to send emails from your own address"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add domain
          </Button>
        }
      />

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleDomainAdded}
      />
    </div>
  );
}
