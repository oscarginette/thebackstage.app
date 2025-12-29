'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Users, Trash2, Mail, Filter, Search } from 'lucide-react';
import DataTable from './DataTable';
import ImportContactsButton from './ImportContactsButton';
import BrevoImportWizardModal from './BrevoImportWizardModal';
import Toast from '@/components/ui/Toast';
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
      setShowToast(true);
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchContacts
  }));

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contact${selectedIds.length !== 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        await fetchContacts(); // Refresh the full list
        setSelectedIds([]);
      } else {
        alert('Failed to delete contacts');
      }
    } catch (error) {
      console.error('Error deleting contacts:', error);
      alert('Error deleting contacts. Please try again.');
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
    },
    {
      header: 'Source',
      accessor: (contact: Contact) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200/50">
          {contact.source}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (contact: Contact) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          contact.subscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${contact.subscribed ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
        </div>
      ),
    },
    {
      header: 'Added',
      accessor: (contact: Contact) => (
        <div className="text-xs text-gray-500 font-medium">{formatDate(contact.createdAt)}</div>
      ),
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
                onClick={handleDelete}
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

      {/* Toast for Brevo connection prompt */}
      <Toast
        message="You need to connect your Brevo account first."
        type="warning"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        action={{
          label: 'Go to Settings',
          onClick: () => {
            window.location.href = '/settings';
          }
        }}
        duration={0} // Manual dismiss only (because there's an action button)
      />
    </div>
  );
});

ContactsList.displayName = 'ContactsList';

export default ContactsList;
