import React from 'react';
import { BrevoList } from '../../types/dashboard';

interface DistributionListsProps {
  lists: BrevoList[];
  selectedLists: number[];
  onToggleList: (listId: number) => void;
  onSave: () => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
}

export default function DistributionLists({
  lists,
  selectedLists,
  onToggleList,
  onSave,
  onTest,
  saving,
  testing
}: DistributionListsProps) {
  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Listas de Distribución</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona las audiencias para tus envíos</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full">
          {selectedLists.length} SELECCIONADAS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px] mb-8 pr-2 custom-scrollbar">
        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
             <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            <p className="text-gray-500 font-medium">No se encontraron listas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => {
              const isSelected = selectedLists.includes(list.id);
              return (
                <label
                  key={list.id}
                  className={`group relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-500/20'
                      : 'bg-white dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleList(list.id)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-4 transition-all duration-300 ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 dark:border-zinc-500 group-hover:border-orange-400'
                  }`}>
                    <svg className={`w-3.5 h-3.5 text-white transform transition-transform duration-300 ${isSelected ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-semibold transition-colors ${isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-gray-200'}`}>
                      {list.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {list.totalSubscribers.toLocaleString()} suscriptores
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          onClick={onSave}
          disabled={saving || selectedLists.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-lg shadow-orange-500/20"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Guardar Config'
          )}
        </button>

        <button
          onClick={onTest}
          disabled={testing || selectedLists.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm border-2 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:border-orange-500 hover:text-orange-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all bg-transparent"
        >
          {testing ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            'Probar Ahora'
          )}
        </button>
      </div>
    </div>
  );
}
