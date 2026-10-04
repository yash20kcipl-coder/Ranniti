import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface PcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  onSave: (data: { name: string; pcNumber: number | string; stateId: string }) => Promise<void>;
}

export const PcFormModal: React.FC<PcFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [pcNumber, setPcNumber] = useState<string | number>('');
  const [stateId, setStateId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setPcNumber(editingItem.pcNumber ?? '');
      setStateId(editingItem.stateId || '');
    } else {
      setName('');
      setPcNumber('');
      setStateId('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, pcNumber: Number(pcNumber), stateId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit PC' : 'Add PC'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Constituency Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pune Parliamentary"
          required
        />
        <FormInput
          type="number"
          label="PC Number"
          value={pcNumber}
          onChange={(e) => setPcNumber(e.target.value)}
          placeholder="e.g. 33"
          required
        />
        <FormInput
          type="select"
          label="State"
          value={stateId}
          onChange={(e) => setStateId(e.target.value)}
          options={stateOptions}
          placeholder="Select State"
          required
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
            {submitting ? 'Saving...' : editingItem ? 'Update PC' : 'Create PC'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PcFormModal;
