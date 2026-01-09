'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, ArrowLeft, Users, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from './DataTable';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import Toast from '../ui/Toast';
import { Button } from '@/components/ui/Button';
import CreateListModal from './CreateListModal';
import SelectContactsToAddModal from './SelectContactsToAddModal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';
import type { FilterDefinition, ActiveFilters } from './DataTableFilters';

type View = 'lists' | 'list-contacts';

interface Contact {
  id: number;
  email: string;
  unsubscribeToken: string;
  subscribed: boolean;
  name?: string | null;
  createdAt?: Date;
}

export default function ContactListsManager() {
  // View state
  const [view, setView] = useState<View>('lists');
  const [selectedList, setSelectedList] = useState<ContactListWithStats | null>(null);

  // Lists view state
  const [lists, setLists] = useState<ContactListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);

  // Contacts view state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [showAddContactsModal, setShowAddContactsModal] = useState(false);
  const [showRemoveContactsModal, setShowRemoveContactsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Toast state
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

  const fetchListContacts = async (listId: string) => {
    setLoadingContacts(true);
    try {
      const response = await fetch(`/api/contact-lists/${listId}/contacts`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data.contacts);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleListClick = (list: ContactListWithStats) => {
    setSelectedList(list);
    setSelectedContactIds([]);
    setView('list-contacts');
    fetchListContacts(list.list.id);
  };

  const handleBackToLists = () => {
    setView('lists');
    setSelectedList(null);
    setContacts([]);
    setSelectedContactIds([]);
  };

  const handleDeleteLists = async () => {
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
      setSelectedHashes([]);
      setShowDeleteListModal(false);
      fetchLists();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveContacts = async () => {
    if (!selectedList) return;

    setRemoving(true);
    try {
      const response = await fetch(`/api/contact-lists/${selectedList.list.id}/remove-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContactIds }),
      });

      if (!response.ok) throw new Error('Failed to remove contacts');

      const data = await response.json();
      setToast({
        message: `Successfully removed ${data.removedCount} contact(s) from list`,
        type: 'success',
      });
      setShowRemoveContactsModal(false);
      setSelectedContactIds([]);
      fetchListContacts(selectedList.list.id);
      fetchLists(); // Refresh list stats
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setRemoving(false);
    }
  };

  // Filter definitions
  const LIST_FILTERS: FilterDefinition[] = [
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { value: 'empty', label: 'Empty (0)' },
        { value: 'small', label: 'Small (<100)' },
        { value: 'medium', label: 'Medium (100-1000)' },
        { value: 'large', label: 'Large (>1000)' },
      ],
    },
  ];

  // Filter predicates
  const filterPredicates: Record<string, (item: ContactListWithStats, value: string | string[]) => boolean> = {
    size: (item, value) => {
      const size = typeof value === 'string' ? value : value[0];
      const count = item.totalContacts;

      switch (size) {
        case 'empty':
          return count === 0;
        case 'small':
          return count > 0 && count < 100;
        case 'medium':
          return count >= 100 && count <= 1000;
        case 'large':
          return count > 1000;
        default:
          return true;
      }
    },
  };

  // Lists view columns
  const listColumns = [
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

  // Contacts view columns
  const contactColumns = [
    {
      header: 'Email',
      accessor: (contact: Contact) => (
        <div>
          <div className="text-sm font-medium text-foreground">{contact.email}</div>
          {contact.name && (
            <div className="text-xs text-foreground/60">{contact.name}</div>
          )}
        </div>
      ),
      sortKey: (contact: Contact) => contact.email.toLowerCase(),
    },
    {
      header: 'Status',
      accessor: (contact: Contact) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            contact.subscribed
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
        </span>
      ),
      sortKey: (contact: Contact) => (contact.subscribed ? 'subscribed' : 'unsubscribed'),
    },
    {
      header: 'Added',
      accessor: (contact: Contact) => (
        <div className="text-sm text-foreground/60">
          {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
        </div>
      ),
      sortKey: (contact: Contact) => contact.createdAt ? new Date(contact.createdAt).getTime() : 0,
    },
  ];

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 20 : -20,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction < 0 ? 20 : -20,
    }),
  };

  const transition = {
    duration: 0.3,
    ease: [0.4, 0.0, 0.2, 1], // Material Design easing
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait" custom={view === 'lists' ? -1 : 1}>
        {view === 'lists' ? (
          <motion.div
            key="lists-view"
            custom={-1}
            initial="enter"
            animate="center"
            exit="exit"
            variants={slideVariants}
            transition={transition}
          >
            <DataTable
              data={lists}
              columns={listColumns}
              loading={loading}
              searchPlaceholder="Search lists..."
              searchFields={(item) => item.list.name}
              emptyMessage="No lists yet. Create your first list to organize your contacts."
              emptyIcon={<FolderOpen className="w-12 h-12 text-foreground/20" />}
              selectable={true}
              getItemId={(item) => hashStringToNumber(item.list.id)}
              selectedIds={selectedHashes}
              onSelectionChange={setSelectedHashes}
              onRowClick={handleListClick}
              filters={LIST_FILTERS}
              filterPredicates={filterPredicates}
              actions={
                <>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="secondary"
                    size="sm"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:border-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    New List
                  </Button>
                  {selectedListIds.length > 0 && (
                    <Button
                      onClick={() => setShowDeleteListModal(true)}
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
          </motion.div>
        ) : (
          <motion.div
            key="contacts-view"
            custom={1}
            initial="enter"
            animate="center"
            exit="exit"
            variants={slideVariants}
            transition={transition}
            className="space-y-4"
          >
            {/* Header with back button */}
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <Button
                onClick={handleBackToLists}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Lists
              </Button>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedList?.list.color }}
                >
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedList?.list.name}
                  </h2>
                  {selectedList?.list.description && (
                    <p className="text-xs text-foreground/60">
                      {selectedList.list.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-foreground/60">
                  ({selectedList?.totalContacts || 0} contacts)
                </span>
              </div>
            </div>

            {/* Contacts DataTable */}
            <DataTable
              data={contacts}
              columns={contactColumns}
              loading={loadingContacts}
              searchPlaceholder="Search contacts in this list..."
              searchFields={(contact) => `${contact.email} ${contact.name || ''}`}
              emptyMessage="No contacts in this list yet. Add contacts to get started."
              emptyIcon={<Users className="w-12 h-12 text-foreground/20" />}
              selectable={true}
              getItemId={(contact) => contact.id}
              selectedIds={selectedContactIds}
              onSelectionChange={setSelectedContactIds}
              actions={
                <>
                  <Button
                    onClick={() => setShowAddContactsModal(true)}
                    variant="secondary"
                    size="sm"
                    className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900 dark:border-green-800"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Contacts
                  </Button>
                  {selectedContactIds.length > 0 && (
                    <Button
                      onClick={() => setShowRemoveContactsModal(true)}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove ({selectedContactIds.length})
                    </Button>
                  )}
                </>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create List Modal */}
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

      {/* Delete Lists Modal */}
      {showDeleteListModal && (
        <Modal
          isOpen={showDeleteListModal}
          onClose={() => !deleting && setShowDeleteListModal(false)}
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
              onClick={() => setShowDeleteListModal(false)}
              disabled={deleting}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLists}
              disabled={deleting}
              variant="danger"
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Add Contacts Modal */}
      {showAddContactsModal && selectedList && (
        <SelectContactsToAddModal
          listId={selectedList.list.id}
          listName={selectedList.list.name}
          existingContactIds={contacts.map(c => c.id)}
          onClose={() => setShowAddContactsModal(false)}
          onSuccess={(addedCount) => {
            setShowAddContactsModal(false);
            setToast({
              message: `Successfully added ${addedCount} contact(s) to list`,
              type: 'success',
            });
            fetchListContacts(selectedList.list.id);
            fetchLists(); // Refresh list stats
          }}
        />
      )}

      {/* Remove Contacts Modal */}
      {showRemoveContactsModal && (
        <Modal
          isOpen={showRemoveContactsModal}
          onClose={() => !removing && setShowRemoveContactsModal(false)}
          title="Remove Contacts from List"
          size="md"
          closeOnBackdropClick={!removing}
        >
          <ModalBody>
            <p className="text-foreground/80">
              Are you sure you want to remove {selectedContactIds.length} contact(s) from{' '}
              <strong>{selectedList?.list.name}</strong>? This will not delete the contacts, only
              remove them from this list.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => setShowRemoveContactsModal(false)}
              disabled={removing}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveContacts}
              disabled={removing}
              variant="danger"
              loading={removing}
            >
              {removing ? 'Removing...' : 'Remove'}
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
