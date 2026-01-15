'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import type { ContactList } from '@/domain/entities/ContactList';

interface ListSelectorProps {
  selectedListIds: string[];
  onChange: (listIds: string[]) => void;
  mode: 'all' | 'include' | 'exclude';
  onModeChange: (mode: 'all' | 'include' | 'exclude') => void;
}

export default function ListSelector({
  selectedListIds,
  onChange,
  mode,
  onModeChange,
}: ListSelectorProps) {
  const t = useTranslations('dashboard.emails.editor');
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists.map((item: any) => item.list));
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (listId: string) => {
    if (selectedListIds.includes(listId)) {
      onChange(selectedListIds.filter(id => id !== listId));
    } else {
      onChange([...selectedListIds, listId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold tracking-wider text-muted-foreground/60">
          {t('sendTo')}
        </label>
        <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-xl border border-border/50">
          <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${mode === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <input
              type="radio"
              checked={mode === 'all'}
              onChange={() => onModeChange('all')}
              className="sr-only"
            />
            <span className="text-xs font-medium">{t('allContacts')}</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${mode === 'include' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <input
              type="radio"
              checked={mode === 'include'}
              onChange={() => onModeChange('include')}
              className="sr-only"
            />
            <span className="text-xs font-medium">{t('specificLists')}</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${mode === 'exclude' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <input
              type="radio"
              checked={mode === 'exclude'}
              onChange={() => onModeChange('exclude')}
              className="sr-only"
            />
            <span className="text-xs font-medium">{t('excludeListsLabel')}</span>
          </label>
        </div>
      </div>

      {mode !== 'all' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {mode === 'include' ? t('selectLists') : t('excludeLists')}
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">{t('loadingLists')}</div>
          ) : lists.length === 0 ? (
            <div className="text-sm text-gray-500">{t('noLists')}</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {lists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedListIds.includes(list.id)}
                    onChange={() => handleToggle(list.id)}
                    className="w-4 h-4 text-[#FF5500] focus:ring-[#FF5500] rounded"
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="text-sm flex-1">{list.name}</span>
                  {selectedListIds.includes(list.id) && (
                    <Check className="w-4 h-4 text-[#FF5500]" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
