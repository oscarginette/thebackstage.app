'use client';

import { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import { LIST_COLORS, LIST_COLOR_OPTIONS, ListColor } from '@/domain/types/list-colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/domain/types/design-tokens';

interface CreateListModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateListModal({ onClose, onSuccess }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ListColor>(LIST_COLORS.INDIGO);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('List name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/contact-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create list');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New List"
      size="md"
      closeOnBackdropClick={!creating}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="List Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VIP Fans, Newsletter Subscribers"
              maxLength={100}
              disabled={creating}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this list"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all text-sm font-medium text-foreground placeholder:text-foreground/30 disabled:bg-foreground/5 disabled:text-foreground/40 disabled:cursor-not-allowed"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                Color
              </label>
              <div className="flex gap-3">
                {LIST_COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={cn(
                      'w-10 h-10 rounded-full transition-transform',
                      color === colorOption ? 'ring-4 ring-offset-2 ring-foreground/20 scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: colorOption }}
                    disabled={creating}
                  />
                ))}
              </div>
            </div>

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
            disabled={creating}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !name.trim()}
            loading={creating}
            variant="primary"
            className="bg-accent hover:bg-accent/90"
          >
            {creating ? 'Creating...' : 'Create List'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
