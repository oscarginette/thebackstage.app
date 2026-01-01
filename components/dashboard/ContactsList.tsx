'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Users, Trash2, Mail, Filter, Search } from 'lucide-react';
import DataTable from './DataTable';
import ImportContactsButton from './ImportContactsButton';
import BrevoImportWizardModal from './BrevoImportWizardModal';
import Toast from '@/components/ui/Toast';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import { apiGet, isApiError } from '@/lib/api-client';
import { GetContactsWithStatsResult } from '@/domain/services/GetContactsWithStatsUseCase';
import { Contact, ContactStats } from '@/domain/repositories/IContactRepository';

interface Props {
  onImportClick: () => void;
}

export interface ContactsListRef {
  refresh: () => void;
}

const ContactsList = forwardRef<ContactsListRef, Props>(({ onImportClick }, ref) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showBrevoImport, setShowBrevoImport] = useState(false);
  const [brevoConnected, setBrevoConnected] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchContacts();
    checkBrevoConnection();
  }, []);

  const fetchContacts = async () => {
    try {
      const result = await apiGet<GetContactsWithStatsResult>('/api/contacts');
      setContacts(result.contacts || []);
      setStats(result.stats || null);
    } catch (error) {
      if (isApiError(error)) {
        console.error('API Error:', error.message, error.code);
      } else {
        console.error('Error fetching contacts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkBrevoConnection = async () => {
    try {
      const res = await fetch('/api/integrations/brevo/status');
      const data = await res.json();
      setBrevoConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking Brevo connection:', error);
      setBrevoConnected(false);
    }
  };

  const handleBrevoImportClick = () => {
    if (brevoConnected) {
      setShowBrevoImport(true);
    } else {
      // Show toast prompting to connect Brevo
      setToastMessage('You need to connect your Brevo account first.');
      setToastType('warning');
      setShowToast(true);
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchContacts
  }));

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        await fetchContacts(); // Refresh the full list
        const deletedCount = selectedIds.length;
        setSelectedIds([]);
        setShowDeleteModal(false);
        setToastMessage(`Successfully deleted ${deletedCount} contact${deletedCount !== 1 ? 's' : ''}`);
        setToastType('success');
        setShowToast(true);
      } else {
        setShowDeleteModal(false);
        setToastMessage('Failed to delete contacts');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error deleting contacts:', error);
      setShowDeleteModal(false);
      setToastMessage('Error deleting contacts. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const columns = [
    {
      header: 'Contact',
      className: 'flex-[2.5] min-w-[240px]',
      accessor: (contact: Contact) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1c1c1c]">{contact.email}</div>
            <div className="text-[10px] text-gray-400">{contact.name || '-'}</div>
          </div>
        </div>
      ),
      sortKey: (contact: Contact) => contact.email.toLowerCase(),
    },
    {
      header: 'Source',
      className: 'flex-1 min-w-[140px]',
      accessor: (contact: Contact) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200/50">
          {contact.source}
        </span>
      ),
      sortKey: (contact: Contact) => contact.source || '',
    },
    {
      header: 'Status',
      className: 'flex-1 min-w-[140px]',
      accessor: (contact: Contact) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          contact.subscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${contact.subscribed ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
        </div>
      ),
      sortKey: (contact: Contact) => contact.subscribed ? 1 : 0,
    },
    {
      header: 'Added',
      className: 'flex-1 min-w-[120px]',
      accessor: (contact: Contact) => (
        <div className="text-xs text-gray-500 font-medium">{formatDate(contact.createdAt)}</div>
      ),
      sortKey: (contact: Contact) => new Date(contact.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Subscribed', value: stats.activeSubscribers, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Total', value: stats.totalContacts, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Last 30 Days', value: stats.newLast30Days, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { label: 'Unsubscribed', value: stats.unsubscribed, color: 'text-red-600', bg: 'bg-red-500/10' },
          ].map((s, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-xl p-4 rounded-2xl border border-[#E8E6DF]/50 flex flex-col gap-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
              <span className={`text-xl font-serif ${s.color}`}>{s.value?.toLocaleString() ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      <DataTable
        data={contacts}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search contacts..."
        searchFields={(c) => `${c.email} ${c.name} ${c.source}`}
        emptyMessage="No contacts found."
        emptyIcon={<Users className="w-16 h-16" />}
        selectable={true}
        getItemId={(c) => c.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={
          <div className="flex gap-2">
            <ImportContactsButton onClick={onImportClick} />
            <button
              onClick={handleBrevoImportClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B996E]/10 text-[#0B996E] hover:bg-[#0B996E]/20 transition-all border border-[#0B996E]/30 text-xs font-bold active:scale-95"
            >
              <Mail className="w-4 h-4" />
              Import from Brevo
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200 text-xs font-bold active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
              </button>
            )}
          </div>
        }
      />

      {/* Brevo Import Wizard Modal */}
      <BrevoImportWizardModal
        isOpen={showBrevoImport}
        onClose={() => setShowBrevoImport(false)}
        onSuccess={() => {
          setShowBrevoImport(false);
          fetchContacts(); // Refresh contacts list
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="md"
        title="Delete Contacts"
        showCloseButton={true}
        closeOnBackdropClick={!deleting}
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                This action cannot be undone. This will permanently delete the selected contact{selectedIds.length !== 1 ? 's' : ''}.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You are about to delete <span className="font-bold text-gray-900">{selectedIds.length}</span> contact{selectedIds.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all border border-red-700 text-sm font-bold active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Contacts'}
            </button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Toast for notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        action={
          toastType === 'warning' && toastMessage.includes('Brevo')
            ? {
                label: 'Go to Settings',
                onClick: () => {
                  window.location.href = '/settings';
                }
              }
            : undefined
        }
        duration={toastType === 'warning' && toastMessage.includes('Brevo') ? 0 : 5000}
      />
    </div>
  );
});

ContactsList.displayName = 'ContactsList';

export default ContactsList;
