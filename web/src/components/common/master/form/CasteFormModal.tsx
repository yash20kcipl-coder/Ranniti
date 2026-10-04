import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FORM_CASTE_CATEGORY_OPTIONS } from '@/constants/dropdownOptions';

interface CasteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  religions: any[];
  castes: any[];
  onSave: (data: { name: string; category: string; religionId?: string; parentCasteId?: string }) => Promise<void>;
}

export const CasteFormModal: React.FC<CasteFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  religions,
  castes,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [religionId, setReligionId] = useState('');
  const [parentCasteId, setParentCasteId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setCategory(editingItem.category || '');
      setReligionId(editingItem.religionId || '');
      setParentCasteId(editingItem.parentCasteId || '');
    } else {
      setName('');
      setCategory('');
      setReligionId('');
      setParentCasteId('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, category, religionId, parentCasteId });
    } finally {
      setSubmitting(false);
    }
  };

  const religionOptions = religions.map((r) => ({ label: r.name, value: r.id }));
  const parentCasteOptions = castes
    .filter((c) => !editingItem || c.id !== editingItem.id)
    .map((c) => ({ label: c.name, value: c.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Caste' : 'Add Caste'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Caste / Subcaste Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kunbi Maratha, Chitpavan Brahmin"
          required
        />
        <FormInput
          type="select"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={FORM_CASTE_CATEGORY_OPTIONS}
          placeholder="Select Category"
          required
        />
        <FormInput
          type="select"
          label="Religion (Optional)"
          value={religionId}
          onChange={(e) => setReligionId(e.target.value)}
          options={religionOptions}
          placeholder="Select Religion"
        />
        <FormInput
          type="select"
          label="Parent Caste (If Subcaste)"
          value={parentCasteId}
          onChange={(e) => setParentCasteId(e.target.value)}
          options={parentCasteOptions}
          placeholder="Select Parent Caste (Optional)"
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
            {submitting ? 'Saving...' : editingItem ? 'Update Caste' : 'Create Caste'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CasteFormModal;
