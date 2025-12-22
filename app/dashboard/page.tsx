'use client';

import { useDashboardData } from '../../hooks/useDashboardData';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import Header from '../../components/dashboard/Header';
import StatCards from '../../components/dashboard/StatCards';
import TrackList from '../../components/dashboard/TrackList';
import ExecutionHistory from '../../components/dashboard/ExecutionHistory';
import ContactsList from '../../components/dashboard/ContactsList';
import CreateEmailButton from '../../components/dashboard/CreateEmailButton';
import EmailEditorModal from '../../components/dashboard/EmailEditorModal';
import DraftsList from '../../components/dashboard/DraftsList';
import { Settings, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import Dock from '../../components/ui/Dock';

export default function Dashboard() {
  const tNav = useTranslations('nav');
  const {
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    sendingTrackId,
    loading,
    message,
    showEmailEditor,
    sendingCustomEmail,
    loadAllTracks,
    handleSendTrack,
    handleSendCustomEmail,
    handleSaveDraft,
    setMessage,
    setShowEmailEditor
  } = useDashboardData();

  const { defaultTemplate } = useEmailTemplates();

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
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <Header />
          <div className="pb-2 flex flex-col items-end gap-3">
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/20 border border-[#E8E6DF] hover:border-[#FF5500]/40 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm group active:scale-95 shadow-sm"
              title={tNav('settings')}
            >
              <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5500] group-hover:rotate-45 transition-all duration-700" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#1c1c1c] transition-colors pr-0.5">
                {tNav('settings')}
              </span>
            </Link>
            <StatCards />
          </div>
        </div>

        {/* Create Email Button */}
        <div className="mb-8">
          <CreateEmailButton onClick={() => setShowEmailEditor(true)} />
        </div>

        {/* Full Width Stack */}
        <div className="flex flex-col gap-12 pb-32">

            {/* 1. Drafts List (Full Width) */}
            <div id="drafts">
              <DraftsList onDraftSent={() => {
                setMessage({ type: 'success', text: 'Borrador enviado correctamente' });
              }} />
            </div>

            {/* 2. Tracks (Full Width) */}
            <div className="w-full" id="tracks">
              <TrackList
                tracks={allTracks}
                 loading={loadingTracks}
                 showAll={showAllTracks}
                 onLoadAll={loadAllTracks}
                 onSend={handleSendTrack}
                 sendingTrackId={sendingTrackId}
              />
            </div>

            {/* 2.5 Download Gates (Full Width Shortcut) */}
            <div id="gates">
              <div className="w-full bg-white/40 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/60 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF5500]/10 flex items-center justify-center text-[#FF5500] group-hover:scale-110 transition-transform">
                     <BarChart2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-[#1c1c1c]">Download Gates</h3>
                    <p className="text-gray-500">Crea pasarelas de descarga para capturar emails y crecer en SoundCloud.</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/download-gates"
                  className="px-8 py-4 rounded-2xl bg-[#1c1c1c] text-white hover:bg-black transition-all shadow-xl font-bold whitespace-nowrap"
                >
                  Gestionar Gates →
                </Link>
              </div>
            </div>

            {/* 3. Execution History (Full Width) */}
            <div id="history">
              <ExecutionHistory history={history} />
            </div>

            {/* 4. Contacts List (Full Width) */}
            <div id="contacts">
              <ContactsList />
            </div>
        </div>

        <Dock />

        {/* Email Editor Modal */}
        {showEmailEditor && (
          <EmailEditorModal
            onClose={() => setShowEmailEditor(false)}
            onSave={handleSendCustomEmail}
            onSaveDraft={handleSaveDraft}
            defaultTemplate={defaultTemplate}
            saving={sendingCustomEmail}
          />
        )}
      </div>
    </div>
  );
}
