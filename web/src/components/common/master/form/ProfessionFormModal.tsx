import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { formatTitleCase } from '@/utils/textUtils';

interface ProfessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  categories: any[];
  onSave: (data: { categoryId: string; name: string }) => Promise<void>;
}

export const ProfessionFormModal: React.FC<ProfessionFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  categories,
  onSave,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setCategoryId(editingItem.categoryId || '');
      setName(editingItem.name || '');
    } else {
      setCategoryId('');
      setName('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ categoryId, name: formatTitleCase(name.trim()) });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Specific Profession' : 'Add Specific Profession'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          type="select"
          required
          label="Profession Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categoryOptions}
          placeholder="Select Profession Category"
        />

        <FormInput
          required
          label="Specific Profession Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Doctor, High School Teacher, Civil Engineer"
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
            {submitting ? 'Saving...' : editingItem ? 'Update Profession' : 'Create Profession'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfessionFormModal;
