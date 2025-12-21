import React from 'react';
import { SoundCloudTrack } from '../../types/dashboard';

interface TrackListProps {
  tracks: SoundCloudTrack[];
  loading: boolean;
  showAll: boolean;
  onLoadAll: () => void;
  onSend: (track: SoundCloudTrack) => void;
  sendingTrackId: string | null;
  hasSelectedLists: boolean;
}

export default function TrackList({
  tracks,
  loading,
  showAll,
  onLoadAll,
  onSend,
  sendingTrackId,
  hasSelectedLists
}: TrackListProps) {
  return (
    <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feed de Tracks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Últimos lanzamientos en SoundCloud</p>
        </div>
        <button
          onClick={onLoadAll}
          disabled={loading}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-orange-500 hover:text-white transition-all duration-300"
        >
          <span>{loading ? 'Cargando...' : showAll ? 'Recargar Feed' : 'Mostrar Feed'}</span>
          {!loading && (
             <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
          )}
        </button>
      </div>

      {!showAll ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/20">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explora tus Tracks</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Visualiza y gestiona el envío manual de tu música
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tracks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No hay tracks disponibles</div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.trackId}
                className="group relative flex items-start gap-5 p-5 bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/50 hover:border-orange-500/30 hover:bg-orange-50/30 dark:hover:bg-zinc-800/80 transition-all duration-300"
              >
                {/* Artwork */}
                <div className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shadow-md">
                   {track.coverImage ? (
                    <img
                      src={track.coverImage}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                       <svg className="w-10 h-10 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                  )}
                  {/* Play Overlay */}
                  <a 
                    href={track.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </a>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-4">
                      {track.title}
                    </h3>
                    {track.alreadySent && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Enviado
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {track.description || "Sin descripción disponible"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {!track.alreadySent && (
                    <button
                      onClick={() => onSend(track)}
                      disabled={sendingTrackId === track.trackId || !hasSelectedLists}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-lg shadow-orange-500/20"
                    >
                      {sendingTrackId === track.trackId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Enviar Campaña</span>
                        </>
                      )}
                    </button>
                    )}
                    
                    <span className="text-xs font-medium text-gray-400 ml-auto">
                       {new Date(track.publishedAt).toLocaleDateString(undefined, {
                         year: 'numeric',
                         month: 'short',
                         day: 'numeric'
                       })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
