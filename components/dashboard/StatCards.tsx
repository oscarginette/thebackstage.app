import React from 'react';
import { Users, Rocket, BarChart3, TrendingUp } from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalContacts: number;
    totalDownloads: number;
    activeCampaigns: number;
    avgConversionRate: number;
  };
  labels?: {
    totalContacts?: string;
    totalDownloads?: string;
    activeCampaigns?: string;
    avgConversionRate?: string;
  };
  formatters?: {
    avgConversionRate?: (value: number) => string;
  };
}

export default function StatCards({ stats, labels, formatters }: StatCardsProps) {
  const safeStats = {
    totalContacts: stats?.totalContacts ?? 0,
    totalDownloads: stats?.totalDownloads ?? 0,
    activeCampaigns: stats?.activeCampaigns ?? 0,
    avgConversionRate: stats?.avgConversionRate ?? 0,
  };

  const defaultLabels = {
    totalContacts: 'Audience',
    totalDownloads: 'Downloads',
    activeCampaigns: 'Engagement',
    avgConversionRate: 'Conversion',
  };

  const finalLabels = { ...defaultLabels, ...labels };

  const cards = [
    {
      label: finalLabels.totalContacts,
      value: safeStats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-100/50',
    },
    {
      label: finalLabels.totalDownloads,
      value: stats.totalDownloads.toLocaleString(),
      icon: Rocket,
      color: 'text-[#FF5500]',
      bgColor: 'bg-[#FF5500]/10',
      borderColor: 'border-[#FF5500]/10',
    },
    {
      label: finalLabels.activeCampaigns,
      value: stats.activeCampaigns.toLocaleString(),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-100/50',
    },
    {
      label: finalLabels.avgConversionRate,
      value: formatters?.avgConversionRate
        ? formatters.avgConversionRate(stats.avgConversionRate)
        : `${stats.avgConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-100/50',
    },
  ];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`
            relative overflow-hidden flex items-center justify-between p-4
            bg-white/60 backdrop-blur-xl border ${card.borderColor}
            rounded-2xl transition-all duration-500
            hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 group
          `}
        >
          {/* Decorative Gradient Backdrop */}
          <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${card.bgColor}`} />

          {/* Icon and Title */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 flex shrink-0 items-center justify-center ${card.bgColor} rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
              <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 font-semibold leading-tight">{card.label}</p>
          </div>

          {/* Value */}
          <h3 className="text-2xl font-serif text-[#1c1c1c] tracking-tight tabular-nums">{card.value}</h3>
        </div>
      ))}
    </div>
  );
}
