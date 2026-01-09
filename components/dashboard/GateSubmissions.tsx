'use client';

import { useEffect, useState, useMemo } from 'react';
import { DownloadSubmission } from '@/types/download-gates';
import { Download, Check, Clock, FileText } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import DataTable from './DataTable';
import { FilterDefinition, ActiveFilters } from './DataTableFilters';
import { BUTTON_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';

// Filter constants
const SUBMISSION_FILTERS = {
  STATUS: {
    ALL: 'all',
    DOWNLOADED: 'downloaded',
    PENDING: 'pending',
  },
  VERIFICATION: {
    ALL: 'all',
    ALL_VERIFIED: 'all_verified',
    REPOST_VERIFIED: 'repost_verified',
    FOLLOW_VERIFIED: 'follow_verified',
    SPOTIFY_CONNECTED: 'spotify_connected',
    NOT_VERIFIED: 'not_verified',
  },
} as const;

export default function GateSubmissions({ gateId }: { gateId: string }) {
  const t = useTranslations('dashboard.gates.submissions');
  const [submissions, setSubmissions] = useState<DownloadSubmission[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ verified, labelKey }: { verified: boolean, labelKey: string }) => (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
      verified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
    }`}>
      {verified ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      <span>{t(labelKey)}</span>
    </div>
  );

  // Define filters
  const filters: FilterDefinition[] = useMemo(() => [
    {
      key: 'status',
      label: t('statusFilter') || 'Status',
      type: 'single',
      options: [
        { value: SUBMISSION_FILTERS.STATUS.ALL, label: t('statusAll') || 'All' },
        { value: SUBMISSION_FILTERS.STATUS.DOWNLOADED, label: t('downloaded') || 'Downloaded' },
        { value: SUBMISSION_FILTERS.STATUS.PENDING, label: t('pending') || 'Pending' },
      ],
    },
    {
      key: 'verification',
      label: t('verificationFilter') || 'Verification',
      type: 'single',
      options: [
        { value: SUBMISSION_FILTERS.VERIFICATION.ALL, label: t('verificationAll') || 'All' },
        { value: SUBMISSION_FILTERS.VERIFICATION.ALL_VERIFIED, label: t('allVerified') || 'All Verified' },
        { value: SUBMISSION_FILTERS.VERIFICATION.REPOST_VERIFIED, label: t('repost') || 'Repost Verified' },
        { value: SUBMISSION_FILTERS.VERIFICATION.FOLLOW_VERIFIED, label: t('follow') || 'Follow Verified' },
        { value: SUBMISSION_FILTERS.VERIFICATION.SPOTIFY_CONNECTED, label: t('spotify') || 'Spotify Connected' },
        { value: SUBMISSION_FILTERS.VERIFICATION.NOT_VERIFIED, label: t('notVerified') || 'Not Verified' },
      ],
    },
  ], [t]);

  // Define filter predicates
  const filterPredicates: Record<string, (item: DownloadSubmission, value: string | string[]) => boolean> = useMemo(() => ({
    status: (submission, value) => {
      if (value === SUBMISSION_FILTERS.STATUS.ALL) return true;
      if (value === SUBMISSION_FILTERS.STATUS.DOWNLOADED) return submission.downloadCompleted;
      if (value === SUBMISSION_FILTERS.STATUS.PENDING) return !submission.downloadCompleted;
      return true;
    },
    verification: (submission, value) => {
      if (value === SUBMISSION_FILTERS.VERIFICATION.ALL) return true;

      if (value === SUBMISSION_FILTERS.VERIFICATION.ALL_VERIFIED) {
        return submission.soundcloudRepostVerified &&
               submission.soundcloudFollowVerified &&
               submission.spotifyConnected;
      }

      if (value === SUBMISSION_FILTERS.VERIFICATION.REPOST_VERIFIED) {
        return submission.soundcloudRepostVerified;
      }

      if (value === SUBMISSION_FILTERS.VERIFICATION.FOLLOW_VERIFIED) {
        return submission.soundcloudFollowVerified;
      }

      if (value === SUBMISSION_FILTERS.VERIFICATION.SPOTIFY_CONNECTED) {
        return submission.spotifyConnected;
      }

      if (value === SUBMISSION_FILTERS.VERIFICATION.NOT_VERIFIED) {
        return !submission.soundcloudRepostVerified &&
               !submission.soundcloudFollowVerified &&
               !submission.spotifyConnected;
      }

      return true;
    },
  }), []);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      header: t('emailName'),
      accessor: (s: DownloadSubmission) => (
        <div className="flex flex-col gap-1">
          <div className={cn(TEXT_STYLES.body.base, 'font-bold text-foreground')}>{s.email}</div>
          <div className={cn(TEXT_STYLES.label.small, 'text-muted-foreground')}>{s.firstName || '-'}</div>
        </div>
      ),
      sortKey: (s: DownloadSubmission) => s.email,
      className: 'flex-[2]',
    },
    {
      header: t('verifiedSteps'),
      accessor: (s: DownloadSubmission) => (
        <div className="flex flex-wrap gap-2">
          <StatusBadge verified={s.soundcloudRepostVerified} labelKey="repost" />
          <StatusBadge verified={s.soundcloudFollowVerified} labelKey="follow" />
          <StatusBadge verified={s.spotifyConnected} labelKey="spotify" />
        </div>
      ),
      className: 'flex-[2]',
    },
    {
      header: t('status'),
      accessor: (s: DownloadSubmission) => (
        s.downloadCompleted ? (
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <Download className="w-4 h-4" />
            {t('downloaded')}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-gray-500">
            <Clock className="w-4 h-4" />
            {t('pending')}
          </span>
        )
      ),
      sortKey: (s: DownloadSubmission) => (s.downloadCompleted ? 1 : 0),
      className: 'flex-1',
    },
    {
      header: t('date'),
      accessor: (s: DownloadSubmission) => (
        <div className={cn(TEXT_STYLES.label.base, 'text-muted-foreground')}>
          {formatDate(s.createdAt)}
        </div>
      ),
      sortKey: (s: DownloadSubmission) => new Date(s.createdAt),
      className: 'flex-1',
    },
  ], [t]);

  return (
    <DataTable
      data={submissions}
      columns={columns}
      loading={loading}
      searchPlaceholder={t('searchPlaceholder')}
      searchFields={(s) => `${s.email} ${s.firstName || ''}`}
      emptyMessage={t('noSubmissions')}
      emptyIcon={<FileText className="w-16 h-16" />}
      filters={filters}
      filterPredicates={filterPredicates}
      actions={
        <button className={cn(
          BUTTON_STYLES.base,
          BUTTON_STYLES.variant.secondary,
          BUTTON_STYLES.size.md,
          'flex items-center gap-2'
        )}>
          <Download className="w-4 h-4" />
          <span>{t('exportCsv')}</span>
        </button>
      }
    />
  );
}
