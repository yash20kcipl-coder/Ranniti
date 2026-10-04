import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface ReligionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onSave: (data: { name: string }) => Promise<void>;
}

export const ReligionFormModal: React.FC<ReligionFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
    } else {
      setName('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Religion' : 'Add Religion'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          required
          value={name}
          label="Religion Name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hinduism, Islam, Sikhism"
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {submitting ? 'Saving...' : editingItem ? 'Update Religion' : 'Create Religion'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReligionFormModal;
