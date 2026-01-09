import React from 'react';
import { Users, Rocket, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import StatCard, { StatCardColorScheme } from '@/components/ui/StatCard';

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
  const t = useTranslations('dashboard.stats');

  const safeStats = {
    totalContacts: stats?.totalContacts ?? 0,
    totalDownloads: stats?.totalDownloads ?? 0,
    activeCampaigns: stats?.activeCampaigns ?? 0,
    avgConversionRate: stats?.avgConversionRate ?? 0,
  };

  const defaultLabels = {
    totalContacts: t('audience'),
    totalDownloads: t('downloads'),
    activeCampaigns: t('engagement'),
    avgConversionRate: t('conversion'),
  };

  const finalLabels = { ...defaultLabels, ...labels };

  const cards: Array<{
    label: string;
    value: string;
    icon: typeof Users;
    colorScheme: StatCardColorScheme;
  }> = [
    {
      label: finalLabels.totalContacts,
      value: safeStats.totalContacts.toLocaleString(),
      icon: Users,
      colorScheme: 'blue',
    },
    {
      label: finalLabels.totalDownloads,
      value: stats.totalDownloads.toLocaleString(),
      icon: Rocket,
      colorScheme: 'orange',
    },
    {
      label: finalLabels.activeCampaigns,
      value: stats.activeCampaigns.toLocaleString(),
      icon: BarChart3,
      colorScheme: 'purple',
    },
    {
      label: finalLabels.avgConversionRate,
      value: formatters?.avgConversionRate
        ? formatters.avgConversionRate(stats.avgConversionRate)
        : `${stats.avgConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      colorScheme: 'green',
    },
  ];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          colorScheme={card.colorScheme}
        />
      ))}
    </div>
  );
}
