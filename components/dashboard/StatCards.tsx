import React from 'react';

interface StatCardsProps {
  activeListsCount: number;
}

export default function StatCards({ activeListsCount }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="group p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Frecuencia</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Diario 20:00 CET</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Programación automática</p>
      </div>

      <div className="group p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Listas Activas</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeListsCount}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Listas de distribución configuradas</p>
      </div>
    </div>
  );
}
