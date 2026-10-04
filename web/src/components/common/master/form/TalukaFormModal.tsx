import { Modal } from '@/components/common/Modal';
import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/common/FormInput';

interface TalukaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  districts: any[];
  onSave: (data: { name: string; stateId: string; districtId: string }) => Promise<void>;
}

export const TalukaFormModal: React.FC<TalukaFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  districts,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setStateId(editingItem.stateId || '');
      setDistrictId(editingItem.districtId || '');
    } else {
      setName('');
      setStateId('');
      setDistrictId('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, stateId, districtId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));
  const filteredDistricts = stateId ? districts.filter((d) => d.stateId === stateId) : districts;
  const districtOptions = filteredDistricts.map((d) => ({ label: d.name, value: d.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Taluka' : 'Add Taluka'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          required
          value={name}
          label="Taluka Name"
          placeholder="e.g. Haveli, Pune City"
          onChange={(e) => setName(e.target.value)}
        />
        <FormInput
          type="select"
          label="State"
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setDistrictId('');
          }}
          options={stateOptions}
          placeholder="Select State"
        />
        <FormInput
          required
          type="select"
          label="District"
          value={districtId}
          options={districtOptions}
          placeholder="Select District"
          onChange={(e) => setDistrictId(e.target.value)}
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
            {submitting ? 'Saving...' : editingItem ? 'Update Taluka' : 'Create Taluka'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TalukaFormModal;
