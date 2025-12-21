'use client';

import { useDashboardData } from '../../hooks/useDashboardData';
import Header from '../../components/dashboard/Header';
import StatCards from '../../components/dashboard/StatCards';
import TrackList from '../../components/dashboard/TrackList';
import ExecutionHistory from '../../components/dashboard/ExecutionHistory';
import ContactsList from '../../components/dashboard/ContactsList';

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
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
          <span className="font-serif text-xl text-[#1c1c1c] animate-pulse">Iniciando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1c1c1c] selection:bg-[#FF5500] selection:text-white overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-aurora-light"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-16">
        
        {/* Global Message Toast */}
        {message && (
          <div className="fixed top-8 right-8 z-50 animate-fade-in-down">
            <div className={`flex items-center gap-4 p-5 pr-12 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              message.type === 'success' 
                ? 'bg-white/90 border-emerald-100 text-emerald-800' 
                : 'bg-white/90 border-red-100 text-red-800'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                 message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <span className="font-medium text-base">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <Header />
          <div className="w-full max-w-md">
            <StatCards />
          </div>
        </div>

        {/* Full Width Stack */}
        <div className="flex flex-col gap-12">

            {/* 1. Tracks (Full Width) */}
            <div className="w-full">
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

            {/* 2. Execution History (Full Width) */}
            <ExecutionHistory history={history} />

            {/* 3. Contacts List (Full Width) */}
            <ContactsList />
        </div>
      </div>
    </div>
  );
}
