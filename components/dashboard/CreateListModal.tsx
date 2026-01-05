'use client';

import { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import { LIST_COLORS, LIST_COLOR_OPTIONS, ListColor } from '@/domain/types/list-colors';

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., VIP Fans, Newsletter Subscribers"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5500] focus:border-[#FF5500]"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this list"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5500] focus:border-[#FF5500]"
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-3">
                {LIST_COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-10 h-10 rounded-full transition-transform ${
                      color === colorOption ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    disabled={creating}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="px-4 py-2 bg-[#FF5500] text-white rounded-lg hover:bg-[#FF5500]/90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create List'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
