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
import { Settings, Plus, Mail, Rocket, Users, ArrowRight, FileText, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PATHS } from '@/lib/paths';
import { USER_ROLES } from '@/domain/types/user-roles';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

function DashboardContent() {
  const tNav = useTranslations('nav');
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';
  const { data: session } = useSession();
  const contactsListRef = useRef<ContactsListRef>(null);
  const { hasAccess, isExpired } = useQuotaAccess();

  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
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
    <main className="min-h-screen bg-[#FDFCF9] font-sans selection:bg-[#FF5500]/10 selection:text-[#FF5500] relative overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF5500]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-24 relative z-10">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 space-y-6">
            <Header />
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[280px]">
            {session?.user && (
              <div className="text-right">
                <div className="text-xs font-medium text-[#1c1c1c]">{session.user.email}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{session.user.role}</div>
              </div>
            )}
            <Link
              href={PATHS.SETTINGS}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/40 border border-[#E8E6DF]/60 hover:border-[#FF5500]/40 hover:bg-white/80 transition-all duration-500 backdrop-blur-md active:scale-95 shadow-sm"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5500] group-hover:rotate-90 transition-all duration-700" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#1c1c1c] transition-colors">
                Settings
              </span>
            </Link>
            <div className="hidden lg:block">
              <div className="flex gap-1.5 justify-end">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-32">

          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

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
                
                <div className="md:col-span-12 lg:col-span-12 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-serif text-[#1c1c1c] flex items-center gap-2.5">
                       <div className="w-8 h-8 rounded-xl bg-[#FF5500]/10 flex items-center justify-center text-[#FF5500]">
                          <Rocket className="w-4 h-4" />
                       </div>
                       Active Gates
                    </h3>
                    <Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1c1c] text-white text-[10px] font-bold hover:bg-black transition-all active:scale-95">
                      <Plus className="w-3 h-3" /> Create New
                    </Link>
                  </div>
                  <div className="bg-white/40 backdrop-blur-2xl border border-[#E8E6DF]/50 rounded-3xl p-6 shadow-xl shadow-black/[0.01]">
                    <CompactGatesList gates={gates} loading={loadingGates} />
                  </div>
                </div>

                <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-4">
                  <div className="h-full">
                    <ExecutionHistory history={history.slice(0, 5)} />
                    {history.length > 5 && (
                      <div className="mt-4 px-2">
                        <button onClick={() => setActiveTab('engagement')} className="text-[10px] font-bold text-gray-400 hover:text-[#1c1c1c] transition-colors uppercase tracking-widest">
                          View full history →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-12 lg:col-span-6 flex flex-col gap-4">
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
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-3xl border border-[#E8E6DF]/60 shadow-lg">
                  <div>
                    <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">Growth Engine</h2>
                    <p className="text-gray-500 text-sm">Create high-converting download gates to grow your audience.</p>
                  </div>
                  <Link
                    href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5500] text-white hover:bg-[#e64d00] transition-all shadow-lg shadow-[#FF5500]/10 font-bold active:scale-95 text-sm"
                  >
                    <Plus className="w-4 h-4 border-2 border-white/30 rounded-md" />
                    New Download Gate
                  </Link>
               </div>
               <DownloadGatesList />
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-3xl border border-[#E8E6DF]/60 shadow-lg">
                  <div>
                    <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">Engagement Center</h2>
                    <p className="text-gray-500 text-sm">Nurture your fan community with personalized email campaigns.</p>
                  </div>
                  <button
                    onClick={() => handleProtectedAction(() => setShowEmailEditor(true))}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg font-bold active:scale-95 text-sm ${
                      !hasAccess
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-gray-400/10'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10'
                    }`}
                    disabled={!hasAccess}
                    title={!hasAccess ? 'Upgrade your plan to send emails' : ''}
                  >
                    <Mail className="w-4 h-4 border-2 border-white/30 rounded-md" />
                    {!hasAccess ? 'Upgrade to Send Emails' : 'Send Custom Email'}
                  </button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <section className="lg:col-span-8 flex flex-col gap-6">
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
                  <aside className="lg:col-span-4 flex flex-col gap-6">
                    <h3 className="text-2xl font-serif px-2">Saved Drafts</h3>
                    <DraftsList onDraftSent={() => {
                      setMessage({ type: 'success', text: 'Borrador enviado correctamente' });
                    }} />
                  </aside>
               </div>

               <section className="space-y-6">
                  <h3 className="text-2xl font-serif px-2">Campaign History</h3>
                  <div className="bg-white/40 border border-[#E8E6DF]/60 rounded-3xl overflow-hidden shadow-sm">
                     <ExecutionHistory history={history} />
                  </div>
               </section>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ContactsList
                ref={contactsListRef}
                onImportClick={() => handleProtectedAction(() => setShowImportModal(true))}
              />
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <h3 className="text-2xl font-serif text-[#1c1c1c]">User Management</h3>
                  <button
                    onClick={fetchAdminUsers}
                    className="px-4 py-2 bg-[#1c1c1c] text-white rounded-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 text-sm font-bold shadow-lg shadow-black/5"
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
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
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
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
