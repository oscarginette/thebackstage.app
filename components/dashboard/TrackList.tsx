import React, { useState, useEffect } from 'react';
import { SoundCloudTrack } from '../../types/dashboard';
import EmailPreviewModal from './EmailPreviewModal';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { PATHS } from '@/lib/paths';

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
      setContactsCount(data.data?.stats?.activeSubscribers || 0);
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
      <div className="bg-white border border-[#E8E6DF] rounded-3xl p-8">
        {!hasSoundCloudId ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Conecta tu SoundCloud</h3>
            <p className="text-sm text-gray-400 mb-4">
              Para ver tus tracks y enviar campañas automáticas, necesitas configurar tu SoundCloud ID en Settings.
            </p>
            <Link
              href={PATHS.SETTINGS}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5500] text-white rounded-full text-sm font-bold hover:bg-[#e64d00] transition-all shadow-lg shadow-[#FF5500]/20 active:scale-95"
            >
              <Settings className="w-4 h-4" />
              Ir a Settings
            </Link>
          </div>
        ) : !showAll ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Explora tu música</h3>
            <p className="text-sm text-gray-400">
              Visualiza tus tracks y lanza campañas de email marketing con un solo clic.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-serif text-[#1c1c1c]">Feed de Tracks</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Tus últimos lanzamientos
                </p>
              </div>
              <button
                onClick={onLoadAll}
                disabled={loading}
                className="px-4 py-2 rounded-full text-xs font-medium border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#FDFCF8] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sincronizando...' : 'Actualizar'}
              </button>
            </div>
          <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {tracks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-serif text-lg">No hay tracks para mostrar</div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.trackId}
                  className="group relative flex items-center gap-3 p-3 bg-[#FDFCF8] rounded-2xl border border-transparent hover:border-[#E8E6DF] hover:bg-white transition-all duration-300"
                >
                  {/* Artwork */}
                  <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden shadow-sm">
                     {track.coverImage ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                         <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-serif text-base text-[#1c1c1c] leading-tight truncate">
                        {track.title}
                      </h3>
                      {track.alreadySent && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8E6DF] text-gray-600">
                          Enviado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-gray-400">
                         {new Date(track.publishedAt).toLocaleDateString(undefined, {
                           month: 'short',
                           day: 'numeric',
                           year: 'numeric'
                         })}
                      </span>
                      <a href={track.url} target="_blank" className="text-[11px] font-medium text-[#FF5500] hover:underline">
                        Ver en SC ↗
                      </a>
                    </div>
                  </div>

                  {/* Button on the right */}
                  <div className="shrink-0">
                    <button
                      onClick={() => handleSendClick(track)}
                      disabled={sendingTrackId === track.trackId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1c] text-white text-[11px] font-bold rounded-full hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-black/10 hover:-translate-y-0.5"
                    >
                      {sendingTrackId === track.trackId ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Enviando</span>
                        </>
                      ) : (
                        <>
                          <span>{track.alreadySent ? 'Reenviar' : 'Enviar'}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
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
