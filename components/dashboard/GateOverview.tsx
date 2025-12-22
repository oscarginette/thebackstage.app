'use client';

import { DownloadGate } from '@/types/download-gates';
import { Eye, User, Download, PieChart, Repeat, Music, Copy, QrCode, Share2 } from 'lucide-react';

export default function GateOverview({ gate }: { gate: DownloadGate }) {
  const stats = [
    { label: 'Total Views', value: gate.stats.views, icon: Eye, color: 'blue' },
    { label: 'Submissions', value: gate.stats.submissions, icon: User, color: 'purple' },
    { label: 'Downloads', value: gate.stats.downloads, icon: Download, color: 'emerald' },
    { label: 'Conv. Rate', value: `${gate.stats.conversionRate}%`, icon: PieChart, color: 'orange' },
    { label: 'SC Reposts', value: gate.stats.soundcloudReposts, icon: Repeat, color: 'orange' },
    { label: 'Spotify Conn.', value: gate.stats.spotifyConnections, icon: Music, color: 'emerald' },
  ];

  const funnelSteps = [
    { name: 'Views', count: gate.stats.views, percent: 100 },
    { name: 'Email Submitted', count: gate.stats.submissions, percent: gate.stats.views > 0 ? (gate.stats.submissions / gate.stats.views * 100).toFixed(1) : 0 },
    { name: 'Actions Completed', count: gate.stats.downloads, percent: gate.stats.submissions > 0 ? (gate.stats.downloads / gate.stats.submissions * 100).toFixed(1) : 0 },
  ];

  const copyLink = () => {
    const url = `${window.location.origin}/gate/${gate.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-[#E8E6DF] shadow-xl hover:shadow-2xl transition-all group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              stat.color === 'purple' ? 'bg-purple-50 text-purple-600' :
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-serif text-[#1c1c1c]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public Link Card */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
          <h3 className="text-xl font-serif text-[#1c1c1c] mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#FF5500]" />
            Promoción
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Link Público</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-5 py-3 rounded-xl bg-[#F5F3ED] border border-[#E8E6DF] text-sm font-mono text-[#1c1c1c] truncate">
                  {window.location.origin}/gate/{gate.slug}
                </div>
                <button 
                  onClick={copyLink}
                  className="p-3 rounded-xl bg-[#1c1c1c] text-white hover:bg-black transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E8E6DF] hover:bg-[#F5F3ED] transition-all text-sm font-medium">
                <QrCode className="w-4 h-4" />
                <span>Generar QR</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF5500] text-white hover:bg-[#e64d00] transition-all text-sm font-medium">
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Funnel Card */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
          <h3 className="text-xl font-serif text-[#1c1c1c] mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#FF5500]" />
            Conversion Funnel
          </h3>

          <div className="space-y-6">
            {funnelSteps.map((step, i) => (
              <div key={step.name} className="relative">
                <div className="flex justify-between items-end mb-2">
                   <div className="text-sm font-bold text-[#1c1c1c]">{step.name}</div>
                   <div className="text-sm font-mono text-gray-500">{step.count} ({step.percent}%)</div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-purple-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-10">
                     <div className="w-0.5 h-4 bg-[#E8E6DF]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
