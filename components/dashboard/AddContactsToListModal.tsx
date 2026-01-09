'use client';

import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';
import { Button } from '@/components/ui/Button';
import { cn } from '@/domain/types/design-tokens';
import { Check } from 'lucide-react';

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
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
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

  const handleToggle = (listId: string) => {
    if (selectedListIds.includes(listId)) {
      setSelectedListIds(selectedListIds.filter((id) => id !== listId));
    } else {
      setSelectedListIds([...selectedListIds, listId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListIds.length === 0) return;

    setAdding(true);
    setError(null);

    try {
      const response = await fetch('/api/contacts/add-to-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds,
          listIds: selectedListIds
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add contacts');
      }

      const result = await response.json();

      if (result.failedLists > 0) {
        const failedNames = result.results
          .filter((r: any) => !r.success)
          .map((r: any) => r.listName)
          .join(', ');
        setError(`Some lists failed: ${failedNames}`);
      } else {
        onSuccess();
      }
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
      title={`Add ${contactIds.length} Contact(s) to Lists`}
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
                  Select Lists ({selectedListIds.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto border border-foreground/10 rounded-xl p-3 space-y-2">
                  {lists.map((item) => (
                    <label
                      key={item.list.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                        'hover:bg-foreground/5',
                        selectedListIds.includes(item.list.id) && 'bg-accent/10 ring-1 ring-accent/20'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedListIds.includes(item.list.id)}
                        onChange={() => handleToggle(item.list.id)}
                        disabled={adding}
                        className="w-4 h-4 text-accent focus:ring-accent/20 rounded border-foreground/20"
                      />
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.list.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {item.list.name}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {item.totalContacts} contacts
                        </div>
                      </div>
                      {selectedListIds.includes(item.list.id) && (
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
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
            disabled={adding || selectedListIds.length === 0}
            loading={adding}
            variant="primary"
            className="bg-accent hover:bg-accent/90"
          >
            {adding
              ? 'Adding...'
              : `Add to ${selectedListIds.length} List${selectedListIds.length !== 1 ? 's' : ''}`
            }
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
