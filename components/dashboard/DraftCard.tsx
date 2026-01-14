'use client';

import { EmailCampaign } from '../../types/dashboard';
import { useState } from 'react';

interface DraftCardProps {
  draft: EmailCampaign;
  onEdit: (draft: EmailCampaign) => void;
  onDelete: (draft: EmailCampaign) => void;
  onSend: (draft: EmailCampaign) => void;
}

export default function DraftCard({ draft, onEdit, onDelete, onSend }: DraftCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(draft);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-[#E8E6DF] p-5 hover:shadow-lg hover:border-[#FF5500]/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
              Borrador
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(draft.createdAt)}
            </span>
          </div>

          <h4 className="font-semibold text-[#1c1c1c] text-lg mb-1 truncate">
            {draft.subject || '(Sin asunto)'}
          </h4>

          {draft.templateId && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Basado en template
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={() => onEdit(draft)}
            className="p-2 rounded-xl border border-[#E8E6DF] text-gray-600 hover:bg-[#F5F3ED] hover:border-[#FF5500]/50 transition-all"
            title="Editar borrador"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Send Button */}
          <button
            onClick={() => onSend(draft)}
            className="px-4 py-2 rounded-xl bg-[#FF5500] text-white text-sm font-medium hover:bg-[#FF6600] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Enviar
          </button>

          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl border border-[#E8E6DF] text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
              title="Eliminar borrador"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-red-50 rounded-xl p-1 border border-red-200">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
