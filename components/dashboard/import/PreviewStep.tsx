'use client';

import { ChevronLeft, AlertTriangle } from 'lucide-react';

interface ImportPreview {
  filename: string;
  fileType: 'csv' | 'json' | 'brevo';
  totalRows: number;
  sampleRows: any[];
}

interface ColumnMappingData {
  emailColumn: string;
  nameColumn: string | null;
  subscribedColumn: string | null;
  metadataColumns: string[];
}

interface Props {
  preview: ImportPreview;
  columnMapping: ColumnMappingData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PreviewStep({ preview, columnMapping, onConfirm, onBack }: Props) {
  const getMappedColumns = () => {
    const columns = [
      { label: 'Email', value: columnMapping.emailColumn },
      { label: 'Name', value: columnMapping.nameColumn || 'Not mapped' },
      { label: 'Subscribed', value: columnMapping.subscribedColumn || 'All default to subscribed' }
    ];

    if (columnMapping.metadataColumns.length > 0) {
      columns.push({
        label: 'Metadata',
        value: `${columnMapping.metadataColumns.length} columns`
      });
    }

    return columns;
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Rows</p>
          <p className="text-xl font-bold text-blue-900 mt-0.5">{preview.totalRows.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Source</p>
          <p className="text-xl font-bold text-emerald-900 mt-0.5 uppercase">
            {preview.fileType === 'brevo' ? 'Brevo API' : preview.fileType}
          </p>
        </div>
      </div>

      {/* Column Mapping Confirmation */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Column Mapping</h3>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1.5">
          {getMappedColumns().map((col, idx) => (
            <div key={idx} className="flex justify-between items-center py-1.5">
              <span className="text-xs font-medium text-gray-700">{col.label}:</span>
              <span className="text-xs text-gray-900 font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {col.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data Preview */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
          Sample Data (First 5 Rows)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columnMapping.emailColumn && (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                    Email
                  </th>
                )}
                {columnMapping.nameColumn && (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                    Name
                  </th>
                )}
                {columnMapping.subscribedColumn && (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                    Subscribed
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.sampleRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columnMapping.emailColumn && (
                    <td className="px-4 py-3 text-gray-900 font-mono text-xs">
                      {row[columnMapping.emailColumn] || '-'}
                    </td>
                  )}
                  {columnMapping.nameColumn && (
                    <td className="px-4 py-3 text-gray-700">
                      {row[columnMapping.nameColumn] || '-'}
                    </td>
                  )}
                  {columnMapping.subscribedColumn && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        String(row[columnMapping.subscribedColumn]).toLowerCase() === 'true' ||
                        String(row[columnMapping.subscribedColumn]).toLowerCase() === 'yes' ||
                        String(row[columnMapping.subscribedColumn]) === '1'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row[columnMapping.subscribedColumn] || 'true'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-900">
            <p className="font-medium mb-0.5">Important:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Existing contacts will be updated with new data (including subscription status)</li>
              <li>New contacts will be added to your database</li>
              <li>Duplicates within the file will be skipped</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-gray-700 font-medium active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 bg-[#FF5500] text-white hover:bg-[#FF5500]/90"
        >
          Start Import ({preview.totalRows.toLocaleString()} contacts)
        </button>
      </div>
    </div>
  );
}
