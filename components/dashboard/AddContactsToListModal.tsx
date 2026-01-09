'use client';

import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';
import { Button } from '@/components/ui/Button';
import { cn } from '@/domain/types/design-tokens';

interface AddContactsToListModalProps {
  contactIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContactsToListModal({
  contactIds,
  onClose,
  onSuccess,
}: AddContactsToListModalProps) {
  const [lists, setLists] = useState<ContactListWithStats[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/contact-lists/${selectedListId}/add-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add contacts');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Add ${contactIds.length} Contact(s) to List`}
      size="md"
      closeOnBackdropClick={!adding}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-foreground/60">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="text-sm text-foreground/60">
                No lists available. Create a list first.
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60">
                  Select List
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-sm font-medium text-foreground disabled:bg-foreground/5 disabled:text-foreground/40 disabled:cursor-not-allowed"
                  disabled={adding}
                >
                  <option value="">-- Select a list --</option>
                  {lists.map((item) => (
                    <option key={item.list.id} value={item.list.id}>
                      {item.list.name} ({item.totalContacts} contacts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
            disabled={adding}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={adding || !selectedListId}
            loading={adding}
            variant="primary"
            className="bg-accent hover:bg-accent/90"
          >
            {adding ? 'Adding...' : 'Add to List'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
