import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface VillageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  districts: any[];
  talukas: any[];
  onSave: (data: { name: string; stateId: string; districtId: string; talukaId: string }) => Promise<void>;
}

export const VillageFormModal: React.FC<VillageFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  districts,
  talukas,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [talukaId, setTalukaId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setStateId(editingItem.stateId || '');
      setDistrictId(editingItem.districtId || '');
      setTalukaId(editingItem.talukaId || '');
    } else {
      setName('');
      setStateId('');
      setDistrictId('');
      setTalukaId('');
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, stateId, districtId, talukaId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));
  const filteredDistricts = stateId ? districts.filter((d) => d.stateId === stateId) : districts;
  const districtOptions = filteredDistricts.map((d) => ({ label: d.name, value: d.id }));
  const filteredTalukas = districtId ? talukas.filter((t) => t.districtId === districtId) : talukas;
  const talukaOptions = filteredTalukas.map((t) => ({ label: t.name, value: t.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Village' : 'Add Village'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Village Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wagholi, Bavdhan, Hinjewadi"
          required
        />
        <FormInput
          type="select"
          label="State"
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setDistrictId('');
            setTalukaId('');
          }}
          options={stateOptions}
          placeholder="Select State"
        />
        <FormInput
          type="select"
          label="District"
          value={districtId}
          onChange={(e) => {
            setDistrictId(e.target.value);
            setTalukaId('');
          }}
          options={districtOptions}
          placeholder="Select District"
        />
        <FormInput
          type="select"
          label="Taluka"
          value={talukaId}
          onChange={(e) => setTalukaId(e.target.value)}
          options={talukaOptions}
          placeholder="Select Taluka"
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
            {submitting ? 'Saving...' : editingItem ? 'Update Village' : 'Create Village'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VillageFormModal;
