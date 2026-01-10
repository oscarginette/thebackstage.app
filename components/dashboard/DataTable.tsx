'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CARD_STYLES, INPUT_STYLES, BUTTON_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';
import DataTableFilters, { FilterDefinition, ActiveFilters } from './DataTableFilters';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortKey?: (item: T) => string | number | Date; // Function to extract sortable value
  sortable?: boolean; // Enable/disable sorting for this column
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
  // Filter props
  filters?: FilterDefinition[];
  filterPredicates?: Record<string, (item: T, value: string | string[]) => boolean>;
  initialFilters?: ActiveFilters;
  onFilterChange?: (filters: ActiveFilters) => void;
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
  filters = [],
  filterPredicates = {},
  initialFilters = {},
  onFilterChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFilters);
  const [announcement, setAnnouncement] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleSort = (columnIndex: number) => {
    const column = columns[columnIndex];

    // Only sort if column has sortKey or sortable is explicitly true
    if (!column.sortKey && column.sortable !== true) return;

    if (sortColumnIndex === columnIndex) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumnIndex(null);
      }
    } else {
      setSortColumnIndex(columnIndex);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string | string[] | null) => {
    const newFilters = { ...activeFilters };

    if (value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Helper function to announce changes to screen readers
  const announceToScreenReader = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  };

  // ESC key handler to deselect all items
  useEffect(() => {
    if (!selectable || !onSelectionChange) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle ESC key
      if (e.key !== 'Escape') return;

      // Don't trigger if no items are selected
      if (selectedIds.length === 0) return;

      // Don't trigger if a modal is open
      const isModalOpen = document.querySelector('[role="dialog"]') !== null;
      if (isModalOpen) return;

      // Don't trigger if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');
      if (isInputFocused) return;

      // Deselect all items
      const count = selectedIds.length;
      onSelectionChange([]);

      // Announce to screen readers
      const itemWord = count === 1 ? 'item' : 'items';
      announceToScreenReader(`${count} ${itemWord} deselected`);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectable, selectedIds, onSelectionChange]);

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data];

    // Step 1: Apply filters FIRST (before sorting and search)
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter((item) => {
        // Apply ALL active filters (AND logic)
        return Object.entries(activeFilters).every(([key, value]) => {
          const predicate = filterPredicates[key];
          if (!predicate) return true; // Skip if no predicate defined

          return predicate(item, value);
        });
      });
    }

    // Step 2: Sort filtered data (if sorting is active)
    if (sortColumnIndex !== null && sortDirection) {
      const column = columns[sortColumnIndex];
      if (column.sortKey) {
        result.sort((a, b) => {
          const aValue = column.sortKey!(a);
          const bValue = column.sortKey!(b);

          // Handle different types
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }

          // String comparison
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();

          if (sortDirection === 'asc') {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        });
      }
    }

    // Step 3: Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => searchFields(item).toLowerCase().includes(query));
    }

    return result;
  }, [data, searchQuery, searchFields, sortColumnIndex, sortDirection, columns, activeFilters, filterPredicates]);

  const handleSelectAll = () => {
    if (!selectable || !getItemId || !onSelectionChange) return;

    const isSelectingAll = selectedIds.length !== sortedAndFilteredData.length;

    if (isSelectingAll) {
      const count = sortedAndFilteredData.length;
      onSelectionChange(sortedAndFilteredData.map(getItemId));
      announceToScreenReader(`All ${count} ${count === 1 ? 'item' : 'items'} selected`);
    } else {
      const count = selectedIds.length;
      onSelectionChange([]);
      announceToScreenReader(`${count} ${count === 1 ? 'item' : 'items'} deselected`);
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
    count: sortedAndFilteredData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  if (loading) {
    return (
      <div className={cn(
        CARD_STYLES.base,
        CARD_STYLES.background.subtle,
        CARD_STYLES.border.default,
        'w-full rounded-3xl p-12 flex flex-col items-center justify-center gap-4'
      )}>
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className={cn(TEXT_STYLES.body.base, 'text-muted-foreground')}>Loading data...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      CARD_STYLES.base,
      CARD_STYLES.background.subtle,
      CARD_STYLES.border.default,
      'w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/[0.02] dark:shadow-black/20 flex flex-col'
    )}>
      {/* Table Header / Toolbar */}
      <div className="p-6 md:p-8 border-b border-border/40 space-y-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                INPUT_STYLES.base,
                INPUT_STYLES.appearance,
                INPUT_STYLES.focus,
                INPUT_STYLES.focusColors.primary,
                INPUT_STYLES.text,
                'px-5 py-3 pl-12 rounded-2xl'
              )}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {actions}
            {filters.length > 0 && (
              <DataTableFilters
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                totalCount={data.length}
                filteredCount={sortedAndFilteredData.length}
              />
            )}
          </div>
        </div>

        {/* Total count */}
        <div className={cn(TEXT_STYLES.label.small, 'text-muted-foreground')}>
          {sortedAndFilteredData.length} {sortedAndFilteredData.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Keyboard shortcut hint - Shows when items are selected */}
      {selectable && selectedIds.length > 0 && (
        <div className="px-6 md:px-8 py-3 bg-primary/5 border-b border-border/40 flex items-center justify-between text-sm">
          <span className={cn(TEXT_STYLES.body.base, 'text-foreground')}>
            {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>
          <span className="flex items-center gap-2 text-xs text-foreground/70">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono font-medium shadow-sm">
              ESC
            </kbd>
            <span>to deselect all</span>
          </span>
        </div>
      )}

      {/* Table Header Row - Fixed */}
      {sortedAndFilteredData.length > 0 && (
        <div className="border-b border-border/40 flex bg-muted/30">
          {selectable && (
            <div className="px-6 py-5 flex-shrink-0" style={{ width: '60px' }}>
              <input
                type="checkbox"
                checked={sortedAndFilteredData.length > 0 && selectedIds.length === sortedAndFilteredData.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          )}
          {columns.map((col, i) => {
            const isSortable = col.sortKey || col.sortable;
            const isSorted = sortColumnIndex === i;

            return (
              <div
                key={i}
                onClick={() => isSortable && handleSort(i)}
                className={cn(
                  'px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em]',
                  col.className?.includes('flex-') || col.className?.includes('w-') ? '' : 'flex-1',
                  col.className || '',
                  isSortable ? 'cursor-pointer hover:text-primary transition-colors select-none' : '',
                  isSorted ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {isSortable && (
                    <span className="flex-shrink-0">
                      {!isSorted && <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                      {isSorted && sortDirection === 'asc' && <ArrowUp className="w-3.5 h-3.5" />}
                      {isSorted && sortDirection === 'desc' && <ArrowDown className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Virtual Scrolling Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto bg-card/40"
        style={{ minHeight: '600px', maxHeight: 'calc(100vh - 300px)' }}
      >
        {sortedAndFilteredData.length === 0 ? (
          <div className="px-8 py-24 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground/20">
                {emptyIcon || <Search className="w-16 h-16" />}
              </div>
              <p className={cn(TEXT_STYLES.heading.h2, 'text-foreground')}>{emptyMessage}</p>
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
              const item = sortedAndFilteredData[virtualRow.index];
              const itemId = selectable && getItemId ? getItemId(item) : -1;
              const isSelected = selectable && selectedIds.includes(itemId);

              return (
                <div
                  key={virtualRow.index}
                  onClick={(e) => {
                    // If selectable, toggle selection when clicking anywhere on the row except buttons
                    if (selectable && getItemId) {
                      const target = e.target as HTMLElement;
                      // Don't toggle if clicking on a button, link, or input
                      if (!target.closest('button, a, input')) {
                        handleSelectOne(itemId);
                      }
                    }
                    // Also call custom onRowClick if provided
                    onRowClick?.(item);
                  }}
                  className={cn(
                    'group transition-colors duration-300 absolute w-full flex border-b border-border/30',
                    'hover:bg-muted/40',
                    rowClickable || selectable ? 'cursor-pointer' : '',
                    isSelected ? 'bg-primary/5' : ''
                  )}
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
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
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

      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}
