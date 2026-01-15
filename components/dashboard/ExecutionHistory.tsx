'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExecutionHistoryItem } from '../../types/dashboard';
import CampaignPreviewModal from './CampaignPreviewModal';

interface ExecutionHistoryProps {
  history: ExecutionHistoryItem[];
}

interface CampaignStats {
  track_id: string;
  track_title: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export default function ExecutionHistory({ history }: ExecutionHistoryProps) {
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [previewingLogId, setPreviewingLogId] = useState<number | null>(null);
  const [statsExpanded, setStatsExpanded] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    fetchCampaignStats();
  }, [history]);

  const fetchCampaignStats = async () => {
    try {
      const res = await fetch('/api/campaign-stats');
      const data = await res.json();

      if (data.stats) {
        // Convertir array a objeto con track_id como key
        const statsMap: Record<string, CampaignStats> = {};
        data.stats.forEach((stat: CampaignStats) => {
          statsMap[stat.track_id] = stat;
        });
        setCampaignStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleStats = (trackId: string) => {
    setStatsExpanded((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  };

  return (
    <Card variant="subtle" padding="md" className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif text-foreground">Campaign History</h3>
          <p className="text-[10px] text-foreground/60 font-bold uppercase tracking-widest">
            {history.length} executed
          </p>
        </div>
        <Button
          onClick={fetchCampaignStats}
          variant="ghost"
          size="xs"
          title="Refresh stats"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-background/50 backdrop-blur-md flex items-center justify-center shadow-sm">
               <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h3 className="text-sm font-serif text-foreground mb-1">No campaigns yet</h3>
            <p className="text-[10px] text-foreground/60 font-bold uppercase tracking-widest">Your sent history will appear here</p>
          </div>
        ) : (
          <div className="relative border-l border-border pl-6 space-y-4 ml-2 my-2">
            {history.map((item, index) => {
              const stats = campaignStats[item.trackId];

              return (
                <div key={`${item.trackId}-${item.executedAt}-${index}`} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-[3px] border-background bg-border group-hover:bg-primary transition-colors duration-300 shadow-sm"></div>

                  {/* Content */}
                  <Card variant="default" padding="sm" className="overflow-hidden hover:shadow-md transition-all">
                    {/* Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-serif text-lg text-foreground mb-1">{item.title}</h3>
                          <div className="text-[10px] text-foreground/60 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>{new Date(item.executedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            <span className="w-1 h-1 rounded-full bg-foreground/20" />
                            <span>Sent to {item.emailsSent} audience members</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setPreviewingLogId(item.executionLogId)}
                            disabled={!item.campaignId}
                            title={item.campaignId ? "Preview campaign" : "Campaign data not available"}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="ml-1">Preview</span>
                          </Button>
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button variant="secondary" size="xs">
                                Listen Track
                              </Button>
                            </a>
                          ) : (
                            <div className="px-3 py-1 text-[10px] font-medium text-foreground/30 uppercase tracking-widest flex items-center gap-1.5">
                              <FileText className="w-3 h-3" />
                              <span>Custom</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {loadingStats ? (
                      <div className="p-4 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-border border-t-primary animate-spin"></div>
                      </div>
                    ) : stats ? (
                      <div className="bg-muted/30">
                        {/* Collapsible Header */}
                        <button
                          onClick={() => toggleStats(item.trackId)}
                          className="w-full p-3 px-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border/30"
                          aria-expanded={statsExpanded[item.trackId] ?? true}
                          aria-label={`Toggle detailed statistics for ${item.title}`}
                        >
                          <span className="text-[10px] text-foreground/60 font-bold uppercase tracking-widest">
                            Detailed Statistics
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-foreground/40 transition-transform duration-200 ${
                              statsExpanded[item.trackId] ?? true ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Animated Stats Content */}
                        <AnimatePresence initial={false}>
                          {(statsExpanded[item.trackId] ?? true) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="p-4">
                                <div className="grid grid-cols-4 gap-3">
                                  {/* Delivered */}
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[9px] text-foreground font-black uppercase tracking-wider">Delivered</div>
                                    <div className="text-lg font-serif text-blue-600">{stats.delivered}</div>
                                    <div className="text-[9px] text-foreground/60 font-bold uppercase tracking-tight">
                                      {stats.delivery_rate || 0}% rate
                                    </div>
                                  </div>

                                  {/* Opens */}
                                  <div className="flex flex-col gap-0.5 border-l border-border/40 pl-3">
                                    <div className="text-[9px] text-foreground font-black uppercase tracking-wider">Opens</div>
                                    <div className="text-lg font-serif text-emerald-600">{stats.opened}</div>
                                    <div className="text-[9px] text-foreground/60 font-bold uppercase tracking-tight">
                                      {stats.open_rate || 0}% rate
                                    </div>
                                  </div>

                                  {/* Clicks */}
                                  <div className="flex flex-col gap-0.5 border-l border-border/40 pl-3">
                                    <div className="text-[9px] text-foreground font-black uppercase tracking-wider">Clicks</div>
                                    <div className="text-lg font-serif text-purple-600">{stats.clicked}</div>
                                    <div className="text-[9px] text-foreground/60 font-bold uppercase tracking-tight">
                                      {stats.click_rate || 0}% rate
                                    </div>
                                  </div>

                                  {/* Bounced */}
                                  <div className="flex flex-col gap-0.5 border-l border-border/40 pl-3">
                                    <div className="text-[9px] text-foreground font-black uppercase tracking-wider">Bounced</div>
                                    <div className="text-lg font-serif text-red-600">{stats.bounced}</div>
                                    <div className="text-[9px] text-foreground/60 font-bold uppercase tracking-tight">
                                      {stats.bounce_rate || 0}% rate
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : null}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Preview Modal */}
      {previewingLogId && (
        <CampaignPreviewModal
          executionLogId={previewingLogId}
          onClose={() => setPreviewingLogId(null)}
        />
      )}
    </Card>
  );
}
