'use client';

import { useEffect, useState } from 'react';
import { DownloadGate } from '@/types/download-gates';
import { BarChart2, Eye, Download, Users, ExternalLink, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DataTable from './DataTable';

export default function DownloadGatesList() {
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
    if (!confirm('Are you sure you want to delete this gate?')) return;
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
      header: 'Gate / Title',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-4">
          {gate.artworkUrl ? (
            <img src={gate.artworkUrl} alt={gate.title} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#F5F3ED] flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-[#CCC]" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-[#1c1c1c]">{gate.title}</div>
            <div className="text-[10px] font-mono text-gray-400">/gate/{gate.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Reach',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[#1c1c1c]">{gate.stats.views.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Views</span>
          </div>
          <div className="w-px h-6 bg-[#E8E6DF]/50" />
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[#1c1c1c]">{gate.stats.downloads.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Downloads</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Audience Growth',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF5500]/10 flex items-center justify-center text-[#FF5500]">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-[#1c1c1c]">{gate.stats.submissions.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Captured Emails</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Conversion',
      accessor: (gate: DownloadGate) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-[#1c1c1c]">{gate.stats.conversionRate}%</span>
          </div>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FF5500] rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(gate.stats.conversionRate, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (gate: DownloadGate) => (
        <div 
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            gate.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
          title={gate.active ? 'Este gate está activo y aceptando visitantes' : 'Este gate está pausado y no acepta visitantes'}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${gate.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {gate.active ? 'Active' : 'Paused'}
        </div>
      ),
    },
    {
      header: '',
      className: 'text-right',
      accessor: (gate: DownloadGate) => (
        <div className="flex items-center justify-end gap-2">
          <Link 
            href={`/gate/${gate.slug}`}
            target="_blank"
            className="p-2 rounded-xl border border-[#E8E6DF]/60 bg-white hover:border-[#1c1c1c]/10 hover:shadow-md transition-all text-gray-400 hover:text-[#1c1c1c]"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <Link 
            href={`/dashboard/download-gates/${gate.id}`}
            className="px-4 py-2 rounded-xl bg-[#1c1c1c] text-white text-[11px] font-bold hover:bg-black transition-all active:scale-95 shadow-lg"
          >
            Manage
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteGate(gate.id);
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={gates}
      columns={columns}
      loading={loading}
      searchPlaceholder="Search gates..."
      searchFields={(gate) => `${gate.title} ${gate.slug}`}
      emptyMessage="No download gates found."
      emptyIcon={<BarChart2 className="w-16 h-16" />}
    />
  );
}
