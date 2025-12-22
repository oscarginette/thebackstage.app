'use client';

import { useEffect, useState, useMemo } from 'react';

interface Contact {
  id: number;
  email: string;
  name: string | null;
  source: string;
  subscribed: boolean;
  created_at: string;
  unsubscribed_at: string | null;
  metadata: any;
}

interface ContactsStats {
  active_subscribers: number;
  unsubscribed: number;
  total_contacts: number;
  from_hypeddit: number;
  from_hypedit: number;
  new_last_30_days: number;
  new_last_7_days: number;
}

type SortField = 'email' | 'name' | 'source' | 'subscribed' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedContacts.map(c => c.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!res.ok) throw new Error('Failed to delete contacts');

      await fetchContacts();
      setSelectedIds([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting contacts:', error);
      alert('Error al eliminar contactos. Por favor intenta de nuevo.');
    } finally {
      setDeleting(false);
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      hypeddit: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Hypeddit' },
      hypedit: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Hypeddit' },
      manual: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Manual' },
      import: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Import' },
    };

    const badge = badges[source] || { color: 'bg-gray-50 text-gray-700 border-gray-200', label: source };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Filtrado y ordenamiento con useMemo para optimización
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts;

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = contacts.filter(contact =>
        contact.email.toLowerCase().includes(query) ||
        (contact.name && contact.name.toLowerCase().includes(query)) ||
        contact.source.toLowerCase().includes(query)
      );
    }

    // Aplicar ordenamiento
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Manejo especial para campos null
      if (sortField === 'name') {
        aValue = aValue || '';
        bValue = bValue || '';
      }

      // Comparación
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [contacts, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-[#E8E6DF]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-serif text-[#1c1c1c]">Contactos</h2>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium">Eliminar ({selectedIds.length})</span>
              </button>
            )}
            <button
              onClick={fetchContacts}
              className="p-2.5 rounded-xl hover:bg-[#F5F3ED] transition-colors"
              title="Refrescar"
            >
              <svg className="w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por email, nombre o fuente..."
              className="w-full px-5 py-3 pl-12 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all text-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-[#666]">
              {filteredAndSortedContacts.length} resultado{filteredAndSortedContacts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedContacts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-200">
              <div className="text-sm text-emerald-700 font-medium mb-1">Suscritos</div>
              <div className="text-2xl font-bold text-emerald-900">{stats.active_subscribers}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200">
              <div className="text-sm text-purple-700 font-medium mb-1">Total</div>
              <div className="text-2xl font-bold text-purple-900">{stats.total_contacts}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200">
              <div className="text-sm text-blue-700 font-medium mb-1">Últimos 30d</div>
              <div className="text-2xl font-bold text-blue-900">{stats.new_last_30_days}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-4 border border-red-200">
              <div className="text-sm text-red-700 font-medium mb-1">Desuscritos</div>
              <div className="text-2xl font-bold text-red-900">{stats.unsubscribed}</div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
            <tr className="border-b border-[#E8E6DF]">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={filteredAndSortedContacts.length > 0 && selectedIds.length === filteredAndSortedContacts.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('email')}
                className="group px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider cursor-pointer hover:bg-[#F5F3ED]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Email
                  <SortIcon field="email" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="group px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider cursor-pointer hover:bg-[#F5F3ED]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Nombre
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('source')}
                className="group px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider cursor-pointer hover:bg-[#F5F3ED]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Fuente
                  <SortIcon field="source" />
                </div>
              </th>
              <th
                onClick={() => handleSort('subscribed')}
                className="group px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider cursor-pointer hover:bg-[#F5F3ED]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Estado
                  <SortIcon field="subscribed" />
                </div>
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="group px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider cursor-pointer hover:bg-[#F5F3ED]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Fecha
                  <SortIcon field="created_at" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DF]">
            {filteredAndSortedContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-[#999] text-lg">
                      {searchQuery ? 'No se encontraron resultados' : 'No hay contactos todavía'}
                    </span>
                    <span className="text-[#BBB] text-sm">
                      {searchQuery ? 'Intenta con otra búsqueda' : 'Los contactos de Hypeddit aparecerán aquí automáticamente'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#F5F3ED]/30 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(contact.id)}
                      onChange={() => handleSelectOne(contact.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-[#1c1c1c]">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#666]">{contact.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getSourceBadge(contact.source)}
                  </td>
                  <td className="px-6 py-4">
                    {contact.subscribed ? (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-red-700">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Desuscrito
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#666]">{formatDate(contact.created_at)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#1c1c1c] mb-1">Confirmar eliminación</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-900">
                ¿Estás seguro de que deseas eliminar <span className="font-bold">{selectedIds.length}</span> contacto{selectedIds.length !== 1 ? 's' : ''}?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-xl border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#F5F3ED] disabled:opacity-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
