import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface DistrictFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  onSave: (data: { name: string; stateId: string }) => Promise<void>;
}

export const DistrictFormModal: React.FC<DistrictFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [stateId, setStateId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setStateId(editingItem.stateId || '');
    } else {
      setName('');
      setStateId('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, stateId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit District' : 'Add District'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          required
          name="name"
          value={name}
          label="District Name"
          placeholder="e.g. Pune"
          onChange={(e) => setName(e.target.value)}
        />
        <FormInput
          required
          name="stateId"
          type="select"
          label="State"
          value={stateId}
          options={stateOptions}
          placeholder="Select State"
          onChange={(e) => setStateId(e.target.value)}
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
            {submitting ? 'Saving...' : editingItem ? 'Update District' : 'Create District'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DistrictFormModal;
