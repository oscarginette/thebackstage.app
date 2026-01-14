'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Users, Trash2, Mail, Filter, Search, FolderPlus, Download } from 'lucide-react';
import DataTable from './DataTable';
import ImportContactsButton from './ImportContactsButton';
import BrevoImportWizardModal from './BrevoImportWizardModal';
import AddContactsToListModal from './AddContactsToListModal';
import { ExportModal } from './ExportModal';
import Toast from '@/components/ui/Toast';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiGet, isApiError } from '@/lib/api-client';
import { GetContactsWithStatsResult } from '@/domain/services/GetContactsWithStatsUseCase';
import { Contact, ContactStats } from '@/domain/repositories/IContactRepository';
import { FilterDefinition, ActiveFilters } from './DataTableFilters';

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
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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

  // Extract unique sources from contacts data
  const uniqueSources = useMemo(() => {
    const sources = new Set(
      contacts
        .map(c => c.source)
        .filter((source): source is string => source !== null && source !== undefined)
    );
    return Array.from(sources).sort();
  }, [contacts]);

  // Filter definitions
  const CONTACT_FILTERS: FilterDefinition[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: uniqueSources.map(source => ({
        label: source.charAt(0).toUpperCase() + source.slice(1),
        value: source,
      })),
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'select',
      options: [
        { label: 'Last 7 days', value: 'last_7' },
        { label: 'Last 30 days', value: 'last_30' },
        { label: 'Last 90 days', value: 'last_90' },
        { label: 'All time', value: 'all' },
      ],
    },
  ], [uniqueSources]);

  // Filter predicates
  const filterPredicates: Record<string, (item: Contact, value: string | string[]) => boolean> = {
    status: (contact: Contact, value: string | string[]) => {
      const statusValue = typeof value === 'string' ? value : value[0];
      if (statusValue === 'subscribed') return contact.subscribed === true;
      if (statusValue === 'unsubscribed') return contact.subscribed === false;
      return true;
    },
    source: (contact: Contact, value: string | string[]) => {
      const sourceValue = typeof value === 'string' ? value : value[0];
      return contact.source === sourceValue;
    },
    dateRange: (contact: Contact, value: string | string[]) => {
      const rangeValue = typeof value === 'string' ? value : value[0];
      if (rangeValue === 'all') return true;

      const contactDate = new Date(contact.createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));

      if (rangeValue === 'last_7') return diffInDays <= 7;
      if (rangeValue === 'last_30') return diffInDays <= 30;
      if (rangeValue === 'last_90') return diffInDays <= 90;
      return true;
    },
  };

  const columns = [
    {
      header: 'Contact',
      className: 'flex-[2.5] min-w-[240px]',
      accessor: (contact: Contact) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{contact.email}</div>
            <div className="text-[10px] text-foreground/60">{contact.name || '-'}</div>
          </div>
        </div>
      ),
      sortKey: (contact: Contact) => contact.email.toLowerCase(),
    },
    {
      header: 'Source',
      className: 'flex-1 min-w-[140px]',
      accessor: (contact: Contact) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-muted text-foreground/60 border border-border/50">
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
        <div className="text-xs text-foreground/60 font-medium">{formatDate(contact.createdAt)}</div>
      ),
      sortKey: (contact: Contact) => new Date(contact.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Subscribed', value: stats.activeSubscribers, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Total', value: stats.totalContacts, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Last 30 Days', value: stats.newLast30Days, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { label: 'Unsubscribed', value: stats.unsubscribed, color: 'text-red-600', bg: 'bg-red-500/10' },
          ].map((s, i) => (
            <Card key={i} variant="subtle" padding="compact" className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-foreground/60 uppercase tracking-widest">{s.label}</span>
              <span className={`text-lg font-serif ${s.color}`}>{s.value?.toLocaleString() ?? 0}</span>
            </Card>
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
        autoScrollOnRowClick={true}
        filters={CONTACT_FILTERS}
        filterPredicates={filterPredicates}
        actions={
          <div className="flex gap-2">
            <ImportContactsButton onClick={onImportClick} />
            <Button
              onClick={handleBrevoImportClick}
              variant="secondary"
              size="sm"
              className="bg-[#0B996E]/10 text-[#0B996E] hover:bg-[#0B996E]/20 border-[#0B996E]/30"
            >
              Import from Brevo
            </Button>
            <Button
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              size="sm"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            {selectedIds.length > 0 && (
              <>
                <Button
                  onClick={() => setShowAddToListModal(true)}
                  variant="secondary"
                  size="sm"
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200"
                >
                  <FolderPlus className="w-4 h-4" />
                  Add to List ({selectedIds.length})
                </Button>
                <Button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  variant="danger"
                  size="sm"
                  loading={deleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
                </Button>
              </>
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
            <p className="text-sm text-foreground/60">
              You are about to delete <span className="font-bold text-foreground">{selectedIds.length}</span> contact{selectedIds.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              variant="danger"
              loading={deleting}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Contacts'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Add Contacts to List Modal */}
      {showAddToListModal && (
        <AddContactsToListModal
          contactIds={selectedIds}
          onClose={() => setShowAddToListModal(false)}
          onSuccess={() => {
            setShowAddToListModal(false);
            setToastMessage('Contacts added to list successfully');
            setToastType('success');
            setShowToast(true);
          }}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedIds={selectedIds}
        totalContacts={stats?.totalContacts || 0}
      />

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
