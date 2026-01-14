/**
 * ExportModal
 *
 * Modal for configuring CSV export options.
 * Allows users to select columns and export scope.
 *
 * Features:
 * - Column selection by category (basic, status, metadata, advanced)
 * - Export all or selected contacts
 * - Select all / deselect all per category
 * - Progress feedback during export
 */

'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  EXPORT_COLUMN_METADATA,
  ContactExportColumn,
  DEFAULT_EXPORT_COLUMNS,
  ExportScope,
  EXPORT_SCOPES,
  EXPORT_FORMATS,
} from '@/domain/types/csv-export';
import { CsvDownloadHelper } from '@/infrastructure/csv/CsvDownloadHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  totalContacts: number;
}

export function ExportModal({
  isOpen,
  onClose,
  selectedIds,
  totalContacts,
}: ExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<ContactExportColumn[]>(
    DEFAULT_EXPORT_COLUMNS
  );
  const [scope, setScope] = useState<ExportScope>(
    selectedIds.length > 0 ? EXPORT_SCOPES.SELECTED : EXPORT_SCOPES.ALL
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group columns by category
  const columnsByCategory = EXPORT_COLUMN_METADATA.reduce(
    (acc, col) => {
      if (!acc[col.category]) acc[col.category] = [];
      acc[col.category].push(col);
      return acc;
    },
    {} as Record<string, typeof EXPORT_COLUMN_METADATA>
  );

  const toggleColumn = (column: ContactExportColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryColumns = columnsByCategory[category].map((col) => col.key);
    setSelectedColumns((prev) => {
      const newSet = new Set([...prev, ...categoryColumns]);
      return Array.from(newSet);
    });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryColumns = columnsByCategory[category].map((col) => col.key);
    setSelectedColumns((prev) =>
      prev.filter((col) => !categoryColumns.includes(col))
    );
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Build API URL
      const params = new URLSearchParams({
        scope,
        columns: selectedColumns.join(','),
        format: EXPORT_FORMATS.CSV,
      });

      if (scope === EXPORT_SCOPES.SELECTED && selectedIds.length > 0) {
        params.set('ids', selectedIds.join(','));
      }

      const apiUrl = `/api/contacts/export?${params.toString()}`;
      const filename = `contacts-${new Date().toISOString().split('T')[0]}.csv`;

      // Trigger download
      await CsvDownloadHelper.downloadFromApi(apiUrl, filename);

      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to export contacts'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getExportCount = () => {
    if (scope === EXPORT_SCOPES.SELECTED) return selectedIds.length;
    return totalContacts;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Export Contacts"
      subtitle={`Export ${getExportCount()} contact${getExportCount() === 1 ? '' : 's'} to CSV`}
      closeOnBackdropClick={!isExporting}
    >
      <ModalBody>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Scope Selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Export Scope</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={scope === EXPORT_SCOPES.ALL}
                onChange={() => setScope(EXPORT_SCOPES.ALL)}
                disabled={isExporting}
                className="cursor-pointer"
              />
              <span>All contacts ({totalContacts})</span>
            </label>
            {selectedIds.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={scope === EXPORT_SCOPES.SELECTED}
                  onChange={() => setScope(EXPORT_SCOPES.SELECTED)}
                  disabled={isExporting}
                  className="cursor-pointer"
                />
                <span>Selected contacts ({selectedIds.length})</span>
              </label>
            )}
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">
            Select Columns ({selectedColumns.length} selected)
          </h3>

          {Object.entries(columnsByCategory).map(([category, columns]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium capitalize text-foreground/80">
                  {category}
                </h4>
                <div className="text-xs space-x-2">
                  <button
                    onClick={() => selectAllInCategory(category)}
                    disabled={isExporting}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => deselectAllInCategory(category)}
                    disabled={isExporting}
                    className="text-foreground/60 hover:underline disabled:opacity-50"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-start gap-2 text-sm cursor-pointer hover:bg-foreground/5 p-2 rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      disabled={isExporting}
                      className="mt-1 cursor-pointer"
                    />
                    <div>
                      <div className="font-medium">{col.label}</div>
                      <div className="text-xs text-foreground/60">
                        {col.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-3 py-1.5 text-sm border-border border rounded-md hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isExporting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {getExportCount()} Contacts</span>
              </>
            )}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
