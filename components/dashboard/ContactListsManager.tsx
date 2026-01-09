'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Edit, Users } from 'lucide-react';
import DataTable from './DataTable';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import Toast from '../ui/Toast';
import { Button } from '@/components/ui/Button';
import CreateListModal from './CreateListModal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';

export default function ContactListsManager() {
  const [lists, setLists] = useState<ContactListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create hash-based selection for DataTable (workaround for string UUIDs)
  const [selectedHashes, setSelectedHashes] = useState<number[]>([]);

  // Simple hash function to convert UUID string to number
  const hashStringToNumber = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Sync selectedHashes to selectedListIds
  useEffect(() => {
    const ids = selectedHashes
      .map(hash => lists.find(item => hashStringToNumber(item.list.id) === hash)?.list.id)
      .filter(Boolean) as string[];
    setSelectedListIds(ids);
  }, [selectedHashes, lists]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(
        selectedListIds.map(id => fetch(`/api/contact-lists/${id}`, { method: 'DELETE' }))
      );
      setToast({
        message: `Successfully deleted ${selectedListIds.length} list(s)`,
        type: 'success',
      });
      setSelectedListIds([]);
      setShowDeleteModal(false);
      fetchLists();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'List Name',
      accessor: (item: ContactListWithStats) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: item.list.color }}
          >
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{item.list.name}</div>
            {item.list.description && (
              <div className="text-xs text-foreground/60">{item.list.description}</div>
            )}
          </div>
        </div>
      ),
      sortKey: (item: ContactListWithStats) => item.list.name.toLowerCase(),
    },
    {
      header: 'Contacts',
      accessor: (item: ContactListWithStats) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground/60" />
          <span className="text-sm font-medium">{item.totalContacts}</span>
          <span className="text-xs text-foreground/60">
            ({item.subscribedContacts} subscribed)
          </span>
        </div>
      ),
      sortKey: (item: ContactListWithStats) => item.totalContacts,
    },
    {
      header: 'Created',
      accessor: (item: ContactListWithStats) => (
        <div className="text-sm text-foreground/60">
          {new Date(item.list.createdAt).toLocaleDateString()}
        </div>
      ),
      sortKey: (item: ContactListWithStats) => new Date(item.list.createdAt).getTime(),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={lists}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search lists..."
        searchFields={(item) => item.list.name}
        emptyMessage="No lists yet. Create your first list to organize your contacts."
        emptyIcon={<FolderOpen className="w-12 h-12 text-foreground/20" />}
        selectable={true}
        getItemId={(item) => hashStringToNumber(item.list.id)}
        selectedIds={selectedHashes}
        onSelectionChange={setSelectedHashes}
        actions={
          <>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="secondary"
              size="sm"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            >
              <Plus className="w-4 h-4" />
              New List
            </Button>
            {selectedListIds.length > 0 && (
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedListIds.length})
              </Button>
            )}
          </>
        }
      />

      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLists();
            setToast({ message: 'List created successfully', type: 'success' });
          }}
        />
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !deleting && setShowDeleteModal(false)}
          title="Delete Lists"
          size="md"
          closeOnBackdropClick={!deleting}
        >
          <ModalBody>
            <p className="text-foreground/80">
              Are you sure you want to delete {selectedListIds.length} list(s)? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="danger"
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
