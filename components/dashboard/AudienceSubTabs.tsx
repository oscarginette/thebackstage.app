'use client';

import React from 'react';
import { Users, FolderOpen } from 'lucide-react';

export type AudienceSubTabType = 'contacts' | 'lists';

interface AudienceSubTabsProps {
  activeSubTab: AudienceSubTabType;
  onSubTabChange: (subTab: AudienceSubTabType) => void;
}

export default function AudienceSubTabs({ activeSubTab, onSubTabChange }: AudienceSubTabsProps) {
  const subTabs = [
    { id: 'contacts' as const, label: 'Contacts', icon: Users },
    { id: 'lists' as const, label: 'Lists', icon: FolderOpen },
  ];

  return (
    <div className="flex p-1 bg-white/30 backdrop-blur-md border border-[#E8E6DF]/50 rounded-xl w-fit">
      {subTabs.map((subTab) => {
        const isActive = activeSubTab === subTab.id;
        return (
          <button
            key={subTab.id}
            onClick={() => onSubTabChange(subTab.id)}
            className={`
              relative flex items-center gap-2 px-5 py-2 rounded-lg transition-all duration-300 group
              ${isActive ? 'text-[#1c1c1c]' : 'text-gray-400 hover:text-gray-600 hover:bg-white/30'}
            `}
          >
            {isActive && (
              <div className="absolute inset-0 bg-white rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200" />
            )}
            <div className="relative flex items-center gap-2">
              <subTab.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="text-xs font-bold tracking-wide">{subTab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
