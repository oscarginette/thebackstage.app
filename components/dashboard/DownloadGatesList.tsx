'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DownloadGate } from '@/types/download-gates';
import { Plus, Eye, Edit, Link as LinkIcon, Trash2, Search, RefreshCw, BarChart2 } from 'lucide-react';

export default function DownloadGatesList() {
  const [gates, setGates] = useState<DownloadGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      console.error('Error fetching download gates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGates = useMemo(() => {
    if (!searchQuery.trim()) return gates;
    const query = searchQuery.toLowerCase();
    return gates.filter(gate => 
      gate.title.toLowerCase().includes(query) || 
      gate.slug.toLowerCase().includes(query)
    );
  }, [gates, searchQuery]);

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/gate/${slug}`;
    navigator.clipboard.writeText(url);
    // In a real app we'd show a toast here
    alert('Link copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#E8E6DF]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-serif text-[#1c1c1c]">My Download Gates</h2>
            <p className="text-[#666] text-xs mt-0.5">Gestiona tus pasarelas de descarga y aumenta tu audiencia.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={fetchGates}
              className="p-2.5 rounded-xl hover:bg-[#F5F3ED] transition-colors"
              title="Refrescar"
            >
              <RefreshCw className="w-5 h-5 text-[#666]" />
            </button>
            <Link
              href="/dashboard/download-gates/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1c1c1c] text-white hover:bg-black transition-all shadow-lg active:scale-95 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Gate</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o slug..."
            className="w-full px-5 py-3 pl-12 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6DF] bg-[#F9F8F4]/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Track Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-center">Views</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-center">Subs</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-center">DLs</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Conversion</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[#666] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DF]">
            {filteredGates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#F5F3ED] flex items-center justify-center">
                       <BarChart2 className="w-8 h-8 text-[#CCC]" />
                    </div>
                    <div>
                      <span className="text-[#999] text-lg block font-medium">
                        {searchQuery ? 'No se encontraron resultados' : 'No tienes gates todavía'}
                      </span>
                      <span className="text-[#BBB] text-sm">
                        {searchQuery ? 'Intenta con otra búsqueda' : 'Comienza creando una nueva pasarela de descarga para tus tracks.'}
                      </span>
                    </div>
                    {!searchQuery && (
                      <Link
                        href="/dashboard/download-gates/new"
                        className="mt-2 text-[#FF5500] font-semibold hover:underline"
                      >
                        Crear mi primer Gate →
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredGates.map((gate) => (
                <tr key={gate.id} className="hover:bg-[#F5F3ED]/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {gate.artworkUrl ? (
                        <img src={gate.artworkUrl} alt={gate.title} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F5F3ED] flex items-center justify-center">
                          <BarChart2 className="w-6 h-6 text-[#CCC]" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-[#1c1c1c]">{gate.title}</div>
                        <div className="text-xs text-[#666] font-mono mt-0.5">/{gate.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-[#1c1c1c]">{gate.stats.views}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-[#1c1c1c]">{gate.stats.submissions}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-sm font-medium text-[#1c1c1c]">{gate.stats.downloads}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-[#1c1c1c]">{gate.stats.conversionRate}%</span>
                       <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#FF5500] rounded-full" 
                            style={{ width: `${Math.min(gate.stats.conversionRate, 100)}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/download-gates/${gate.id}`}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-md transition-all text-[#666] hover:text-[#FF5500]"
                        title="Ver Stats"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/download-gates/${gate.id}/edit`}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-md transition-all text-[#666] hover:text-[#FF5500]"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => copyPublicLink(gate.slug)}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-md transition-all text-[#666] hover:text-[#FF5500]"
                        title="Copiar Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 hover:shadow-md transition-all text-[#666] hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
