'use client';

/**
 * DataTableFilters Component
 *
 * Generic, reusable filter UI component for DataTable.
 * Follows Clean Architecture + SOLID principles.
 *
 * Features:
 * - Dropdown panel with all available filters
 * - Support for 'select' and 'multi-select' filter types
 * - Active filter badges with individual remove
 * - Results summary when filtering
 * - Click-outside-to-close functionality
 * - Fully type-safe with TypeScript generics
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles filter UI rendering and interaction
 * - Open/Closed: Easy to extend with new filter types
 * - Dependency Inversion: Accepts filters as props (abstraction)
 *
 * Usage:
 * ```tsx
 * <DataTableFilters
 *   filters={filterDefinitions}
 *   activeFilters={{ status: ['active'], genre: ['rock'] }}
 *   onFilterChange={(key, value) => updateFilters(key, value)}
 *   totalCount={1000}
 *   filteredCount={42}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { BUTTON_STYLES, CARD_STYLES, TEXT_STYLES, INPUT_STYLES, cn } from '@/domain/types/design-tokens';

/**
 * Filter Definition Types
 */
export type FilterType = 'select' | 'multi-select';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: FilterType;
  options: FilterOption[];
}

/**
 * Active Filters Type
 * Maps filter key to selected value(s)
 */
export type ActiveFilters = Record<string, string | string[]>;

/**
 * Component Props
 */
interface DataTableFiltersProps {
  filters: FilterDefinition[];
  activeFilters: ActiveFilters;
  onFilterChange: (key: string, value: string | string[] | null) => void;
  totalCount: number;
  filteredCount: number;
}

/**
 * DataTableFilters Component
 */
export default function DataTableFilters({
  filters,
  activeFilters,
  onFilterChange,
  totalCount,
  filteredCount,
}: DataTableFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count
  const activeFilterCount = Object.entries(activeFilters).reduce((count, [_key, value]) => {
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);

  const hasActiveFilters = activeFilterCount > 0;
  const isFiltering = filteredCount !== totalCount;

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Handle filter change for select type
   */
  const handleSelectChange = (key: string, value: string) => {
    const currentValue = activeFilters[key];
    // Toggle: if same value, clear it; otherwise set it
    onFilterChange(key, currentValue === value ? null : value);
  };

  /**
   * Handle filter change for multi-select type
   */
  const handleMultiSelectChange = (key: string, value: string) => {
    const currentValues = (activeFilters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange(key, newValues.length > 0 ? newValues : null);
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    Object.keys(activeFilters).forEach((key) => {
      onFilterChange(key, null);
    });
  };

  /**
   * Remove individual filter value
   */
  const handleRemoveFilter = (key: string, value?: string) => {
    const currentValue = activeFilters[key];

    if (Array.isArray(currentValue)) {
      // Multi-select: remove specific value
      const newValues = currentValue.filter((v) => v !== value);
      onFilterChange(key, newValues.length > 0 ? newValues : null);
    } else {
      // Select: clear entire filter
      onFilterChange(key, null);
    }
  };

  /**
   * Get filter option label by value
   */
  const getOptionLabel = (filterKey: string, value: string): string => {
    const filter = filters.find((f) => f.key === filterKey);
    const option = filter?.options.find((opt) => opt.value === value);
    return option?.label || value;
  };

  /**
   * Get filter label by key
   */
  const getFilterLabel = (filterKey: string): string => {
    const filter = filters.find((f) => f.key === filterKey);
    return filter?.label || filterKey;
  };

  /**
   * Render active filter badges
   */
  const renderActiveFilterBadges = () => {
    const badges: React.ReactNode[] = [];

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Multi-select: one badge per value
        value.forEach((val) => {
          badges.push(
            <div
              key={`${key}-${val}`}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                'bg-primary/10 text-primary border border-primary/20',
                'hover:bg-primary/20'
              )}
            >
              <span className="text-primary/60">{getFilterLabel(key)}:</span>
              <span>{getOptionLabel(key, val)}</span>
              <button
                onClick={() => handleRemoveFilter(key, val)}
                className="hover:text-primary/80 transition-colors"
                aria-label={`Remove ${getOptionLabel(key, val)} filter`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        });
      } else if (value) {
        // Select: single badge
        badges.push(
          <div
            key={key}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              'bg-primary/10 text-primary border border-primary/20',
              'hover:bg-primary/20'
            )}
          >
            <span className="text-primary/60">{getFilterLabel(key)}:</span>
            <span>{getOptionLabel(key, value)}</span>
            <button
              onClick={() => handleRemoveFilter(key)}
              className="hover:text-primary/80 transition-colors"
              aria-label={`Remove ${getFilterLabel(key)} filter`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    });

    return badges;
  };

  // Edge case: no filters defined
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Filter Button + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            BUTTON_STYLES.base,
            BUTTON_STYLES.size.sm,
            hasActiveFilters ? BUTTON_STYLES.variant.primary : BUTTON_STYLES.variant.secondary,
            'flex items-center gap-2 rounded-xl'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
              hasActiveFilters
                ? 'bg-background text-foreground'
                : 'bg-foreground/10 text-foreground'
            )}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen ? 'rotate-180' : '')} />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <div
              className={cn(
                CARD_STYLES.base,
                CARD_STYLES.background.solid,
                CARD_STYLES.border.default,
                'absolute top-full left-0 mt-2 z-50 min-w-[280px] max-w-md rounded-2xl shadow-xl overflow-hidden'
              )}
            >
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                <h3 className={cn(TEXT_STYLES.heading.h3, 'text-foreground')}>Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className={cn(
                      TEXT_STYLES.body.subtle,
                      'text-primary hover:text-primary/80 transition-colors font-medium'
                    )}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Filter Options */}
              <div className="max-h-[400px] overflow-y-auto">
                {filters.map((filter) => (
                  <div key={filter.key} className="px-5 py-4 border-b border-border/20 last:border-b-0">
                    {/* Filter Label */}
                    <div className={cn(TEXT_STYLES.label.small, 'mb-3')}>
                      {filter.label}
                    </div>

                    {/* Filter Options */}
                    <div className="space-y-2">
                      {filter.options.map((option) => {
                        const isActive =
                          filter.type === 'multi-select'
                            ? ((activeFilters[filter.key] as string[]) || []).includes(option.value)
                            : activeFilters[filter.key] === option.value;

                        return (
                          <label
                            key={option.value}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all',
                              'hover:bg-muted/40',
                              isActive ? 'bg-primary/5' : ''
                            )}
                          >
                            <input
                              type={filter.type === 'multi-select' ? 'checkbox' : 'radio'}
                              checked={isActive}
                              onChange={() =>
                                filter.type === 'multi-select'
                                  ? handleMultiSelectChange(filter.key, option.value)
                                  : handleSelectChange(filter.key, option.value)
                              }
                              className={cn(
                                'w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer',
                                filter.type === 'radio' ? 'rounded-full' : ''
                              )}
                            />
                            <span className={cn(TEXT_STYLES.body.base, 'text-foreground')}>
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {renderActiveFilterBadges()}
        </div>
      )}

      {/* Results Summary */}
      {isFiltering && (
        <div className={cn(TEXT_STYLES.body.subtle, 'text-foreground/60')}>
          Showing {filteredCount} of {totalCount} records
        </div>
      )}
    </div>
  );
}
