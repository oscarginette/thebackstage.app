import React, { useState, useEffect } from 'react';
import { SoundCloudTrack } from '../../types/dashboard';
import EmailPreviewModal from './EmailPreviewModal';
import Link from 'next/link';
import { Settings } from 'lucide-react';

interface TrackListProps {
  tracks: SoundCloudTrack[];
  loading: boolean;
  showAll: boolean;
  onLoadAll: () => void;
  onSend: (track: SoundCloudTrack, customContent?: { subject?: string; greeting?: string; message?: string; signature?: string }) => void;
  sendingTrackId: string | null;
  hasSoundCloudId?: boolean;
}

export default function TrackList({
  tracks,
  loading,
  showAll,
  onLoadAll,
  onSend,
  sendingTrackId,
  hasSoundCloudId = true
}: TrackListProps) {
  const [previewTrack, setPreviewTrack] = useState<SoundCloudTrack | null>(null);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    fetchContactsCount();
  }, []);

  const fetchContactsCount = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContactsCount(data.stats?.active_subscribers || 0);
    } catch (error) {
      console.error('Error fetching contacts count:', error);
    }
  };

  const handleSendClick = (track: SoundCloudTrack) => {
    setPreviewTrack(track);
  };

  const handleConfirmSend = (customContent?: { subject?: string; greeting?: string; message?: string; signature?: string }) => {
    if (previewTrack) {
      onSend(previewTrack, customContent);
      setPreviewTrack(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-[#E8E6DF] rounded-[32px] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="font-serif text-3xl text-[#1c1c1c] mb-2">Feed de Tracks</h2>
            <p className="text-sm text-gray-400">Tus últimos lanzamientos en SoundCloud</p>
          </div>
          {hasSoundCloudId && (
            <button
              onClick={onLoadAll}
              disabled={loading}
              className="px-6 py-3 rounded-full text-sm font-medium border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#FDFCF8] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sincronizando...' : showAll ? 'Actualizar Feed' : 'Ver Todos'}
            </button>
          )}
        </div>

        {!hasSoundCloudId ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-[#FF5500]/5 to-[#FF5500]/10 rounded-[24px] border-2 border-dashed border-[#FF5500]/20">
            <div className="w-16 h-16 mb-4 rounded-full bg-white border-2 border-[#FF5500]/30 flex items-center justify-center shadow-lg">
              <Settings className="w-7 h-7 text-[#FF5500]" />
            </div>
            <h3 className="font-serif text-lg text-[#1c1c1c] mb-2">Conecta tu SoundCloud</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-4">
              Para ver tus tracks y enviar campañas automáticas, necesitas configurar tu SoundCloud ID en Settings.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5500] text-white rounded-full text-sm font-bold hover:bg-[#e64d00] transition-all shadow-lg shadow-[#FF5500]/20 active:scale-95"
            >
              <Settings className="w-4 h-4" />
              Ir a Settings
            </Link>
          </div>
        ) : !showAll ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#FDFCF8] rounded-[24px]">
            <div className="w-16 h-16 mb-6 rounded-full bg-white border border-[#E8E6DF] flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl text-[#1c1c1c] mb-2">Explora tu música</h3>
            <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
              Visualiza tus tracks y lanza campañas de email marketing con un solo clic.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {tracks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-serif text-lg">No hay tracks para mostrar</div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.trackId}
                  className="group relative flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-[#FDFCF8] rounded-[20px] border border-transparent hover:border-[#E8E6DF] hover:bg-white transition-all duration-300"
                >
                  {/* Artwork */}
                  <div className="relative shrink-0 w-full sm:w-20 h-20 sm:h-20 rounded-xl overflow-hidden shadow-sm">
                     {track.coverImage ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                         <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-xl text-[#1c1c1c] leading-tight">
                        {track.title}
                      </h3>
                      {track.alreadySent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8E6DF] text-gray-600">
                          Enviado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                      <span className="text-xs font-medium text-gray-400">
                         {new Date(track.publishedAt).toLocaleDateString(undefined, {
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric'
                         })}
                      </span>
                      <a href={track.url} target="_blank" className="text-xs font-medium text-[#FF5500] hover:underline">
                        SoundCloud ↗
                      </a>
                    </div>

                    <div className="flex justify-center sm:justify-start">
                      <button
                        onClick={() => handleSendClick(track)}
                        disabled={sendingTrackId === track.trackId}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-white text-xs font-bold rounded-full hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-black/10 hover:-translate-y-0.5"
                      >
                        {sendingTrackId === track.trackId ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>{track.alreadySent ? 'Reenviar Campaña' : 'Enviar Campaña'}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewTrack && (
        <EmailPreviewModal
          track={previewTrack}
          onClose={() => setPreviewTrack(null)}
          onConfirm={handleConfirmSend}
          sending={sendingTrackId === previewTrack.trackId}
          contactsCount={contactsCount}
        />
      )}
    </>
  );
}
