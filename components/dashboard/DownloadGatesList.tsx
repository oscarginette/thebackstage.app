'use client';

import { useEffect, useState } from 'react';
import { DownloadGate } from '@/types/download-gates';
import { BarChart2, Eye, Download, Users, ExternalLink, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DataTable from './DataTable';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n/context';

export default function DownloadGatesList() {
  const t = useTranslations('dashboard.gates.list');
  const [gates, setGates] = useState<DownloadGate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGates();
  }, []);

  const fetchGates = async () => {
    try {
      const res = await fetch('/api/download-gates');
      if (res.ok) {
        const data = await res.json();
        setGates(data.gates || []);
      }
    } catch (error) {
      console.error('Error fetching gates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGate = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/download-gates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGates(gates.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Error deleting gate:', error);
    }
  };

  const columns = [
    {
      header: t('gateTitle'),
      className: 'flex-[3] min-w-[200px]',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-4">
          {gate.artworkUrl ? (
            <img src={gate.artworkUrl} alt={gate.title} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-foreground/20" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-foreground">{gate.title}</div>
            <div className="text-[10px] font-mono text-foreground/60">/gate/{gate.slug}</div>
          </div>
        </div>
      ),
      sortKey: (gate: DownloadGate) => gate.title.toLowerCase(),
    },
    {
      header: t('reach'),
      className: 'flex-1 min-w-[120px]',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-foreground">{gate.stats.views.toLocaleString()}</span>
            <span className="text-[9px] text-foreground/60 font-bold uppercase tracking-widest">{t('views')}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-foreground">{gate.stats.downloads.toLocaleString()}</span>
            <span className="text-[9px] text-foreground/60 font-bold uppercase tracking-widest">{t('downloads')}</span>
          </div>
        </div>
      ),
      sortKey: (gate: DownloadGate) => gate.stats.views,
    },
    {
      header: t('audienceGrowth'),
      className: 'flex-1 min-w-[140px]',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF5500]/10 flex items-center justify-center text-[#FF5500]">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{gate.stats.submissions.toLocaleString()}</span>
            <span className="text-[9px] text-foreground/60 font-bold uppercase tracking-widest">{t('capturedEmails')}</span>
          </div>
        </div>
      ),
      sortKey: (gate: DownloadGate) => gate.stats.submissions,
    },
    {
      header: t('conversion'),
      className: 'w-40 flex-none',
      accessor: (gate: DownloadGate) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-foreground">{gate.stats.conversionRate}%</span>
          </div>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(gate.stats.conversionRate, 100)}%` }}
            />
          </div>
        </div>
      ),
      sortKey: (gate: DownloadGate) => gate.stats.conversionRate,
    },
    {
      header: t('status'),
      className: 'w-32 flex-none',
      accessor: (gate: DownloadGate) => (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            gate.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
          title={gate.active ? t('activeTooltip') : t('pausedTooltip')}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${gate.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {gate.active ? t('active') : t('paused')}
        </div>
      ),
      sortKey: (gate: DownloadGate) => gate.active ? 1 : 0,
    },
    {
      header: '',
      className: 'w-48 flex-none text-right',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/gate/${gate.slug}`}
            target="_blank"
            className="p-2 rounded-xl border border-border bg-background hover:border-border/60 hover:shadow-md transition-all text-foreground/60 hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <Link href={`/dashboard/download-gates/${gate.id}`}>
            <Button variant="primary" size="xs">
              {t('manage')}
            </Button>
          </Link>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              deleteGate(gate.id);
            }}
            variant="ghost"
            size="sm"
            className="text-foreground/60 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={gates}
      columns={columns}
      loading={loading}
      searchPlaceholder={t('searchPlaceholder')}
      searchFields={(gate) => `${gate.title} ${gate.slug}`}
      emptyMessage={t('emptyMessage')}
      emptyIcon={<BarChart2 className="w-16 h-16" />}
    />
  );
}
