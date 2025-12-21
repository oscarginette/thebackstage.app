'use client';

import { useDashboardData } from '../../hooks/useDashboardData';
import Header from '../../components/dashboard/Header';
import StatCards from '../../components/dashboard/StatCards';
import DistributionLists from '../../components/dashboard/DistributionLists';
import TrackList from '../../components/dashboard/TrackList';
import ExecutionHistory from '../../components/dashboard/ExecutionHistory';

export default function Dashboard() {
  const {
    lists,
    selectedLists,
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    sendingTrackId,
    loading,
    saving,
    testing,
    message,
    handleToggleList,
    handleSave,
    handleTest,
    loadAllTracks,
    handleSendTrack,
    setMessage
  } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 dark:border-orange-900 border-t-orange-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Cargando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 selection:bg-orange-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Header />

        {/* Global Message Toast */}
        {message && (
          <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
            <div className={`flex items-center gap-3 p-4 pr-10 rounded-xl shadow-2xl backdrop-blur-md border ${
              message.type === 'success' 
                ? 'bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                : 'bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              {message.type === 'success' ? (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <span className="font-medium text-sm">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column (Stats & Control) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <StatCards activeListsCount={selectedLists.length} />
            
            <div className="flex-1">
              <DistributionLists 
                lists={lists} 
                selectedLists={selectedLists}
                onToggleList={handleToggleList}
                onSave={handleSave}
                onTest={handleTest}
                saving={saving}
                testing={testing}
              />
            </div>
          </div>

          {/* Right Column (Tracks) */}
          <div className="lg:col-span-8">
            <TrackList 
              tracks={allTracks}
               loading={loadingTracks}
               showAll={showAllTracks}
               onLoadAll={loadAllTracks}
               onSend={handleSendTrack}
               sendingTrackId={sendingTrackId}
               hasSelectedLists={selectedLists.length > 0}
            />
          </div>
        </div>

        <ExecutionHistory history={history} />
      </div>
    </div>
  );
}
