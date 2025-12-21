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
    <div className="flex flex-col bg-white border border-[#E8E6DF] rounded-[32px] p-8 h-full transition-all duration-300 hover:shadow-2xl hover:shadow-black/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl text-[#1c1c1c] mb-2">Audiencias</h2>
          <p className="text-sm text-gray-400">Selecciona quién recibirá tus tracks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[250px] mb-8 pr-2 custom-scrollbar">
        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-[#FDFCF8] rounded-2xl border border-dashed border-[#E8E6DF]">
            <p className="font-serif text-xl text-gray-400">Sin listas disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => {
              const isSelected = selectedLists.includes(list.id);
              return (
                <label
                  key={list.id}
                  className={`group relative flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? 'bg-[#1c1c1c] border-[#1c1c1c] text-white'
                      : 'bg-white border-[#E8E6DF] hover:border-gray-300 text-[#1c1c1c]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleList(list.id)}
                    className="sr-only"
                  />
                  
                  {/* Custom Checkbox UI */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 transition-all duration-300 ${
                    isSelected
                      ? 'border-white bg-white/20'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {isSelected && (
                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-base leading-tight">
                      {list.name}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                      {list.totalSubscribers.toLocaleString()} suscriptores
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto border-t border-[#E8E6DF] pt-8">
        <button
          onClick={onSave}
          disabled={saving || selectedLists.length === 0}
          className="flex items-center justify-center px-6 py-4 rounded-full font-medium text-sm bg-[#1c1c1c] text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-black/10"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>

        <button
          onClick={onTest}
          disabled={testing || selectedLists.length === 0}
          className="flex items-center justify-center px-6 py-4 rounded-full font-medium text-sm border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#FDFCF8] hover:border-gray-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {testing ? 'Verificando...' : 'Hacer Prueba'}
        </button>
      </div>
    </div>
  );
}
