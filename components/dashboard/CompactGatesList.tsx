'use client';

import React from 'react';
import { DownloadGate } from '@/types/download-gates';
import { BarChart2, Eye, Download, Users as UsersIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PATHS } from '@/lib/paths';
import { Card } from '@/components/ui/Card';
import { cn } from '@/domain/types/design-tokens';

interface CompactGatesListProps {
  gates: DownloadGate[];
  loading: boolean;
}

export default function CompactGatesList({ gates, loading }: CompactGatesListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-foreground/10 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const recentGates = gates.slice(0, 3);

  if (recentGates.length === 0) {
    return (
      <Card variant="subtle" padding="lg" className="rounded-3xl border-dashed text-center">
        <p className="text-foreground/50 text-sm">No download gates created yet.</p>
        <Link
          href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}
          className="text-accent text-sm font-bold hover:underline mt-2 inline-block"
        >
          Create your first gate →
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {recentGates.map((gate) => (
        <Link
          key={gate.id}
          href={PATHS.DASHBOARD.DOWNLOAD_GATES.DETAILS(gate.id)}
          className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-white/5 border border-border rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-500 group"
        >
          <div className="flex items-center gap-4">
             <div className="relative">
               {gate.artworkUrl ? (
                  <img src={gate.artworkUrl} alt={gate.title} className="w-11 h-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-foreground/40 group-hover:scale-105 transition-transform duration-500">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                )}
                {gate.active && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                )}
             </div>
              <div>
                <h4 className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1 mb-0.5">{gate.title}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] text-foreground/40 font-bold uppercase tracking-wider">
                    <Eye className="w-3 h-3" />
                    {gate.stats.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-foreground/40 font-bold uppercase tracking-wider">
                    <Download className="w-3 h-3" />
                    {gate.stats.downloads.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-accent font-black uppercase tracking-wider">
                    <UsersIcon className="w-3 h-3" />
                    {gate.stats.submissions.toLocaleString()}
                  </div>
                </div>
              </div>
          </div>
          <div
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-border text-foreground/40 group-hover:text-foreground group-hover:border-foreground/20 group-hover:shadow-md transition-all active:scale-95"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      ))}
      {gates.length > 3 && (
        <div className="text-center py-2 text-xs font-bold text-foreground/40">
          {gates.length - 3} more gates
        </div>
      )}
    </div>
  );
}
