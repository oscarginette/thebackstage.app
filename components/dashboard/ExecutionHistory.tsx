import React from 'react';
import { ExecutionHistoryItem } from '../../types/dashboard';

interface ExecutionHistoryProps {
  history: ExecutionHistoryItem[];
}

export default function ExecutionHistory({ history }: ExecutionHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 mt-8 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Historial de Ejecuciones</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.trackId}
            className="group p-5 bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/50 hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
               {/* Tiny Cover */}
               <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  {item.coverImage && (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                  )}
               </div>

               <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {item.emailsSent}
                    </span>
                    <span className="flex items-center gap-1">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {new Date(item.executedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
               </div>
            </div>
            
            <a href={item.url} target="_blank" rel="noreFerrer" className="mt-4 block w-full py-2 text-xs font-bold text-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
              Ver track
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
