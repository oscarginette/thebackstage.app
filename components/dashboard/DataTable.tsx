'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  actions?: React.ReactNode;
  rowClickable?: boolean;
  onRowClick?: (item: T) => void;
  // Multiselect props
  selectable?: boolean;
  getItemId?: (item: T) => number;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

export default function DataTable<T>({
  data,
  columns,
  loading,
  searchPlaceholder = 'Search...',
  searchFields,
  emptyMessage = 'No data found.',
  emptyIcon,
  actions,
  rowClickable,
  onRowClick,
  selectable = false,
  getItemId,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => searchFields(item).toLowerCase().includes(query));
  }, [data, searchQuery, searchFields]);

  const handleSelectAll = () => {
    if (!selectable || !getItemId || !onSelectionChange) return;

    if (selectedIds.length === filteredData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredData.map(getItemId));
    }
  };

  const handleSelectOne = (id: number) => {
    if (!selectable || !onSelectionChange) return;

    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  if (loading) {
    return (
      <div className="w-full bg-white/40 backdrop-blur-xl rounded-3xl border border-[#E8E6DF]/50 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FF5500] animate-spin" />
        <span className="text-sm font-medium text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[#E8E6DF]/50 overflow-hidden shadow-2xl shadow-black/[0.02] flex flex-col">
      {/* Table Header / Toolbar */}
      <div className="p-6 md:p-8 border-b border-[#E8E6DF]/40 space-y-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-5 py-3 pl-12 rounded-2xl border border-[#E8E6DF]/60 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/10 focus:border-[#FF5500]/40 transition-all text-sm outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {actions}
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#E8E6DF]/60 bg-white/60 text-gray-500 hover:text-[#1c1c1c] hover:bg-white transition-all text-sm font-bold active:scale-95">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Total count */}
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Table Header Row - Fixed */}
      {filteredData.length > 0 && (
        <div className="border-b border-[#E8E6DF]/40 flex bg-gray-50/50">
          {selectable && (
            <div className="px-6 py-5 flex-shrink-0" style={{ width: '60px' }}>
              <input
                type="checkbox"
                checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
              />
            </div>
          )}
          {columns.map((col, i) => (
            <div
              key={i}
              className={`px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ${col.className?.includes('flex-') || col.className?.includes('w-') ? '' : 'flex-1'} ${col.className || ''}`}
            >
              {col.header}
            </div>
          ))}
        </div>
      )}

      {/* Virtual Scrolling Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto bg-white/40"
        style={{ minHeight: '600px', maxHeight: 'calc(100vh - 300px)' }}
      >
        {filteredData.length === 0 ? (
          <div className="px-8 py-24 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-gray-200">
                {emptyIcon || <Search className="w-16 h-16" />}
              </div>
              <p className="text-lg font-serif text-[#1c1c1c]">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredData[virtualRow.index];
              const itemId = selectable && getItemId ? getItemId(item) : -1;
              const isSelected = selectable && selectedIds.includes(itemId);

              return (
                <div
                  key={virtualRow.index}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    group transition-colors duration-300 absolute w-full flex border-b border-[#E8E6DF]/30
                    hover:bg-[#F5F3ED]/40
                    ${rowClickable ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-[#FF5500]/5' : ''}
                  `}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {selectable && (
                    <div className="px-6 py-5 flex-shrink-0 flex items-center" style={{ width: '60px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(itemId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
                      />
                    </div>
                  )}
                  {columns.map((col, j) => (
                    <div key={j} className={`px-8 py-5 ${col.className?.includes('flex-') || col.className?.includes('w-') ? '' : 'flex-1'} ${col.className || ''}`}>
                      {col.accessor(item)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
