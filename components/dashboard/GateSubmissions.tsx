'use client';

import { useEffect, useState, useMemo } from 'react';
import { DownloadSubmission } from '@/types/download-gates';
import { Search, Download, Check, Clock, X, FileText, Filter } from 'lucide-react';

export default function GateSubmissions({ gateId }: { gateId: string }) {
  const [submissions, setSubmissions] = useState<DownloadSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [gateId]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/download-gates/${gateId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const query = searchQuery.toLowerCase();
    return submissions.filter(s => 
      s.email.toLowerCase().includes(query) || 
      (s.firstName && s.firstName.toLowerCase().includes(query))
    );
  }, [submissions, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ verified, label }: { verified: boolean, label: string }) => (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
      verified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {verified ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );

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
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-8 border-b border-[#E8E6DF]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-[#1c1c1c]">Fans & Submissions</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E6DF] hover:bg-[#F5F3ED] transition-all text-sm font-medium">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por email o nombre..."
              className="w-full px-5 py-3 pl-12 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white text-gray-600 hover:bg-[#F5F3ED] transition-all text-sm text-medium">
             <Filter className="w-4 h-4" />
             <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6DF] bg-[#F9F8F4]/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Email/Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Verified Steps</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DF]">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-[#CCC]">
                    <FileText className="w-12 h-12" />
                    <span className="text-lg font-medium">No hay envíos todavía</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((s) => (
                <tr key={s.id} className="hover:bg-[#F5F3ED]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[#1c1c1c]">{s.email}</div>
                    <div className="text-xs text-gray-500">{s.firstName || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge verified={s.soundcloudRepostVerified} label="Repost" />
                      <StatusBadge verified={s.soundcloudFollowVerified} label="Follow" />
                      <StatusBadge verified={s.spotifyConnected} label="Spotify" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {s.downloadCompleted ? (
                      <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                        <Download className="w-4 h-4" />
                        Downloaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(s.createdAt)}</div>
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
