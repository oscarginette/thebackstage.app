'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useQuotaAccess } from '../../hooks/useQuotaAccess';
import Header from '../../components/dashboard/Header';
import StatCards from '../../components/dashboard/StatCards';
import TrackList from '../../components/dashboard/TrackList';
import ExecutionHistory from '../../components/dashboard/ExecutionHistory';
import ContactsList, { ContactsListRef } from '../../components/dashboard/ContactsList';
import EmailEditorModal from '../../components/dashboard/EmailEditorModal';
import ImportWizardModal from '../../components/dashboard/ImportWizardModal';
import DraftsList from '../../components/dashboard/DraftsList';
import DownloadGatesList from '../../components/dashboard/DownloadGatesList';
import DashboardTabs, { TabType } from '../../components/dashboard/DashboardTabs';
import CompactGatesList from '../../components/dashboard/CompactGatesList';
import QuotaWarning from '../../components/dashboard/QuotaWarning';
import UserManagementTable from '../../components/admin/UserManagementTable';
import UserTable from '../../components/admin/UserTable';
import AudienceSubTabs, { AudienceSubTabType } from '../../components/dashboard/AudienceSubTabs';
import ContactListsManager from '../../components/dashboard/ContactListsManager';
import { DashboardSidebar } from '../../components/dashboard/DashboardSidebar';
import { Settings, Plus, Mail, Rocket, Users, ArrowRight, FileText, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PATHS } from '@/lib/paths';
import { USER_ROLES } from '@/domain/types/user-roles';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';
import { Card, CardContent } from '@/components/ui/Card';
import { LAYOUT_STYLES, cn } from '@/domain/types/design-tokens';

function DashboardContent() {
  const tNav = useTranslations('nav');
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';
  const audienceSubTab = (searchParams.get('audienceTab') as AudienceSubTabType) || 'contacts';
  const { data: session } = useSession();
  const contactsListRef = useRef<ContactsListRef>(null);
  const { hasAccess, isExpired } = useQuotaAccess();

  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const setAudienceSubTab = (subTab: AudienceSubTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('audienceTab', subTab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Handle clicking on protected actions
  const handleProtectedAction = (action: () => void) => {
    if (!hasAccess) {
      router.push(PATHS.UPGRADE);
      return;
    }
    action();
  };
  
  const {
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    loadAllTracks,
    handleSendTrack,
    handleSendCustomEmail,
    handleSaveDraft,
    sendingTrackId,
    sendingCustomEmail,
    contactStats: stats,
    gates,
    loadingGates,
    hasSoundCloudId,
    message,
    setMessage
  } = useDashboardData();

  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Admin state
  const isAdmin = session?.user?.role === USER_ROLES.ADMIN;
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);

  // Quota state
  const [quota, setQuota] = useState<{
    currentContacts: number;
    maxContacts: number;
    currentEmails: number;
    maxEmails: number;
    subscriptionPlan: string;
    quotaUsagePercent: {
      contacts: number;
      emails: number;
    };
  } | null>(null);

  const derivedStats = useMemo(() => {
    return {
      totalContacts: stats?.activeSubscribers || 0,
      totalDownloads: gates.reduce((acc, gate) => acc + (gate.stats?.totalDownloads || 0), 0),
      activeCampaigns: history.length,
      avgConversionRate: gates.length > 0
        ? gates.reduce((acc, gate) => acc + (gate.stats?.conversionRate || 0), 0) / gates.length
        : 0
    };
  }, [stats, gates, history]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch quota information
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/user/quota');
        if (response.ok) {
          const data = await response.json();
          setQuota(data);
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error);
      }
    };

    fetchQuota();
  }, []);

  // Fetch admin users when admin tab is active
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      fetchAdminUsers();
    }
  }, [activeTab, isAdmin]);

  const fetchAdminUsers = async () => {
    try {
      setLoadingAdminUsers(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-accent/10 selection:text-accent">
      
      {/* Sidebar Navigation - Fixed on Desktop */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <DashboardSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isAdmin={isAdmin}
            user={session?.user} 
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 relative overflow-x-hidden">
        
        {/* Dynamic Background (Scoped to main area) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-[1240px] mx-auto px-6 lg:px-8 pt-6 pb-12 relative z-10">
          
            {/* Mobile Header (Simple fallback for now) */}
            <div className={cn("lg:hidden mb-6", LAYOUT_STYLES.spacing.section)}>
               <Header />
               <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
            </div>

            {/* Page Header (Contextual) */}
            <div className="hidden lg:flex items-center justify-between mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-3xl font-serif text-foreground">
                    {activeTab === 'overview' && 'Overview'}
                    {activeTab === 'growth' && 'Growth Engine'}
                    {activeTab === 'engagement' && 'Engagement Center'}
                    {activeTab === 'audience' && 'Audience Manager'}
                    {activeTab === 'admin' && 'Admin Console'}
                </h2>
                
                {activeTab === 'overview' && (
                    <div className="flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            System Operational
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="pb-32">

            {activeTab === 'overview' && (
                <div className={cn(LAYOUT_STYLES.spacing.section, "animate-in fade-in slide-in-from-bottom-4 duration-500")}>

                {/* Quota Warning */}
                {quota && quota.quotaUsagePercent && (
                    <QuotaWarning
                    contactsUsed={quota.currentContacts}
                    contactsLimit={quota.maxContacts}
                    emailsUsed={quota.currentEmails}
                    emailsLimit={quota.maxEmails}
                    subscriptionPlan={quota.subscriptionPlan}
                    />
                )}

                <StatCards stats={derivedStats} />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    <div className="md:col-span-12 lg:col-span-12 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-serif text-foreground flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                <Rocket className="w-3.5 h-3.5" />
                            </div>
                            Active Gates
                        </h3>
                        <Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-bold hover:bg-foreground/90 transition-all active:scale-95">
                        <Plus className="w-3.5 h-3.5" /> Create New
                        </Link>
                    </div>
                    <Card padding="sm" className="rounded-2xl">
                        <CompactGatesList gates={gates} loading={loadingGates} />
                    </Card>
                    </div>

                    <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-3">
                    <div className="h-full">
                        <ExecutionHistory history={history.slice(0, 5)} />
                        {history.length > 5 && (
                        <div className="mt-2 px-2">
                            <button onClick={() => setActiveTab('engagement')} className="text-[10px] font-bold text-foreground/40 hover:text-foreground transition-colors uppercase tracking-widest">
                            View full history →
                            </button>
                        </div>
                        )}
                    </div>
                    </div>

                    <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-3">
                    <div className="h-full">
                        <DraftsList onDraftSent={() => {
                            setMessage({ type: 'success', text: 'Borrador enviado correctamente' });
                        }} />
                    </div>
                    </div>

                </div>
                </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'growth' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card padding="lg">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-serif text-foreground mb-1">Create & Manage Gates</h2>
                            <p className="text-foreground/50 text-sm">Create high-converting download gates to grow your audience.</p>
                        </div>
                        <Link
                            href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all shadow-lg shadow-accent/10 font-bold active:scale-95 text-sm"
                        >
                            <Plus className="w-4 h-4 border-2 border-white/30 rounded-md" />
                            New Download Gate
                        </Link>
                        </div>
                    </Card>
                    <DownloadGatesList />
                </div>
            )}

            {activeTab === 'engagement' && (
                <div className={cn(LAYOUT_STYLES.spacing.section, "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
                    <Card padding="lg">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-serif text-foreground mb-1">Email Campaigns</h2>
                            <p className="text-foreground/50 text-sm">Nurture your fan community with personalized email campaigns.</p>
                        </div>
                        <button
                            onClick={() => handleProtectedAction(() => setShowEmailEditor(true))}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg font-bold active:scale-95 text-sm ${
                            !hasAccess
                                ? 'bg-foreground/20 text-foreground/40 cursor-not-allowed shadow-black/5'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10'
                            }`}
                            disabled={!hasAccess}
                            title={!hasAccess ? 'Upgrade your plan to send emails' : ''}
                        >
                            <Mail className="w-4 h-4 border-2 border-white/30 rounded-md" />
                            {!hasAccess ? 'Upgrade to Send Emails' : 'Send Custom Email'}
                        </button>
                        </div>
                    </Card>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <section className={cn("lg:col-span-8", LAYOUT_STYLES.spacing.section)}>
                        <h3 className="text-2xl font-serif px-2">Quick-send Tracks</h3>
                        <TrackList
                            tracks={allTracks}
                            loading={loadingTracks}
                            showAll={showAllTracks}
                            onLoadAll={loadAllTracks}
                            onSend={handleSendTrack}
                            sendingTrackId={sendingTrackId}
                            hasSoundCloudId={hasSoundCloudId}
                        />
                        </section>
                        <aside className={cn("lg:col-span-4", LAYOUT_STYLES.spacing.section)}>
                        <h3 className="text-2xl font-serif px-2">Saved Drafts</h3>
                        <DraftsList onDraftSent={() => {
                            setMessage({ type: 'success', text: 'Borrador enviado correctamente' });
                        }} />
                        </aside>
                    </div>

                    <section className="space-y-6">
                        <ExecutionHistory history={history} />
                    </section>
                </div>
            )}

            {activeTab === 'audience' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Sub-tabs */}
                <div className="flex items-center justify-between">
                    <AudienceSubTabs
                    activeSubTab={audienceSubTab}
                    onSubTabChange={setAudienceSubTab}
                    />
                </div>

                {/* Sub-tab Content */}
                {audienceSubTab === 'contacts' && (
                    <ContactsList
                    ref={contactsListRef}
                    onImportClick={() => handleProtectedAction(() => setShowImportModal(true))}
                    />
                )}

                {audienceSubTab === 'lists' && (
                    <ContactListsManager />
                )}
                </div>
            )}

            {activeTab === 'admin' && isAdmin && (
                <div className={cn(LAYOUT_STYLES.spacing.section, "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
                {/* Admin Stats - Reusing StatCards */}
                <StatCards
                    stats={{
                    totalContacts: adminUsers.length,
                    totalDownloads: adminUsers.filter(u => u.subscriptionPlan !== SUBSCRIPTION_PLANS.FREE && u.active).length,
                    activeCampaigns: adminUsers.filter(u => u.active).reduce((sum, u) => {
                        const prices = {
                        [SUBSCRIPTION_PLANS.FREE]: 0,
                        [SUBSCRIPTION_PLANS.PRO]: 29,
                        [SUBSCRIPTION_PLANS.BUSINESS]: 79,
                        [SUBSCRIPTION_PLANS.UNLIMITED]: 199
                        };
                        return sum + (prices[u.subscriptionPlan as keyof typeof prices] || 0);
                    }, 0),
                    avgConversionRate: adminUsers.reduce((sum, u) => sum + (u.quota?.emailsSentToday || 0), 0)
                    }}
                    labels={{
                    totalContacts: 'Total Users',
                    totalDownloads: 'Active Subs',
                    activeCampaigns: 'Est. MRR',
                    avgConversionRate: 'Emails Sent'
                    }}
                    formatters={{
                    avgConversionRate: (value) => value.toLocaleString()
                    }}
                />

                {/* User Management */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-serif text-foreground">User Management</h3>
                    <button
                        onClick={fetchAdminUsers}
                        className="px-4 py-2 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-all active:scale-95 flex items-center gap-2 text-sm font-bold shadow-lg shadow-black/5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    </div>

                    <UserManagementTable 
                    users={adminUsers} 
                    onRefresh={fetchAdminUsers} 
                    loading={loadingAdminUsers}
                    />
                </div>
                </div>
            )}

            </div>

            {/* Global UI */}
            {showEmailEditor && (
            <EmailEditorModal
                onClose={() => setShowEmailEditor(false)}
                onSave={(content) => handleSendCustomEmail(content)}
                onSaveDraft={(content) => handleSaveDraft(content)}
                saving={sendingCustomEmail}
            />
            )}

            {showImportModal && (
            <ImportWizardModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                setShowImportModal(false);
                contactsListRef.current?.refresh();
                setMessage({ type: 'success', text: 'Contacts imported successfully' });
                }}
            />
            )}
            
            {/* Toast Messages */}
            {message && (
            <div className="fixed bottom-12 right-12 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
                message.type === 'success' 
                ? 'bg-emerald-500/90 border-emerald-400 text-white' 
                : 'bg-red-500/90 border-red-400 text-white'
                }`}>
                    {message.type === 'success' ? (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    ) : (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">!</div>
                    )}
                    <span className="text-sm font-bold">{message.text}</span>
                </div>
            </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
