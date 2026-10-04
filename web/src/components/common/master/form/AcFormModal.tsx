import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface AcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  districts: any[];
  pcs: any[];
  onSave: (data: { name: string; acNumber: number | string; pcId: string; districtId?: string; stateId?: string }) => Promise<void>;
}

export const AcFormModal: React.FC<AcFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  districts,
  pcs,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [acNumber, setAcNumber] = useState<string | number>('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [pcId, setPcId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      const derivedStateId =
        editingItem.stateId ||
        pcs.find((p) => p.id === editingItem.pcId)?.stateId ||
        districts.find((d) => d.id === editingItem.districtId)?.stateId ||
        '';
      const derivedDistrictId =
        editingItem.districtId ||
        pcs.find((p) => p.id === editingItem.pcId)?.districtId ||
        '';

      setName(editingItem.name || '');
      setAcNumber(editingItem.acNumber ?? '');
      setStateId(derivedStateId);
      setDistrictId(derivedDistrictId);
      setPcId(editingItem.pcId || '');
    } else {
      setName('');
      setAcNumber('');
      setStateId('');
      setDistrictId('');
      setPcId('');
    }
  }, [editingItem, isOpen, pcs, districts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, acNumber: Number(acNumber), pcId, districtId, stateId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));
  const filteredDistricts = stateId ? districts.filter((d) => d.stateId === stateId) : districts;
  const districtOptions = filteredDistricts.map((d) => ({ label: d.name, value: d.id }));
  const filteredPcs = stateId ? pcs.filter((p) => p.stateId === stateId) : pcs;
  const pcOptions = filteredPcs.map((p) => ({ label: p.name, value: p.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Assembly Constituency (AC)' : 'Add Assembly Constituency (AC)'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          type="select"
          label="State"
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setDistrictId('');
            setPcId('');
          }}
          options={stateOptions}
          placeholder="Select State"
        />
        <FormInput
          type="select"
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={districtOptions}
          placeholder="Select District"
        />
        <FormInput
          type="select"
          label="Parliamentary Constituency (PC)"
          value={pcId}
          onChange={(e) => setPcId(e.target.value)}
          options={pcOptions}
          placeholder="Select PC"
          required
        />
        <FormInput
          type="number"
          label="AC Number"
          value={acNumber}
          onChange={(e) => setAcNumber(e.target.value)}
          placeholder="e.g. 210"
          required
        />
        <FormInput
          label="Assembly Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kothrud Assembly"
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
            {submitting ? 'Saving...' : editingItem ? 'Update AC' : 'Create AC'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AcFormModal;
