import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface WardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  districts: any[];
  pcs: any[];
  acs: any[];
  onSave: (data: { name: string; wardNumber: number | string; acId: string }) => Promise<void>;
}

export const WardFormModal: React.FC<WardFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  districts,
  pcs,
  acs,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [wardNumber, setWardNumber] = useState<string | number>('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [pcId, setPcId] = useState('');
  const [acId, setAcId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      const matchedAc = acs.find((a) => a.id === editingItem.acId);
      const derivedPcId = editingItem.pcId || matchedAc?.pcId || '';
      const derivedDistrictId = editingItem.districtId || matchedAc?.districtId || '';
      const derivedStateId =
        editingItem.stateId ||
        matchedAc?.stateId ||
        pcs.find((p) => p.id === derivedPcId)?.stateId ||
        districts.find((d) => d.id === derivedDistrictId)?.stateId ||
        '';

      setName(editingItem.name || '');
      setWardNumber(editingItem.wardNumber ?? '');
      setStateId(derivedStateId);
      setDistrictId(derivedDistrictId);
      setPcId(derivedPcId);
      setAcId(editingItem.acId || '');
    } else {
      setName('');
      setWardNumber('');
      setStateId('');
      setDistrictId('');
      setPcId('');
      setAcId('');
    }
  }, [editingItem, isOpen, acs, pcs, districts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({ name, wardNumber: Number(wardNumber), acId });
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));
  const filteredDistricts = stateId ? districts.filter((d) => d.stateId === stateId) : districts;
  const districtOptions = filteredDistricts.map((d) => ({ label: d.name, value: d.id }));
  const filteredPcs = stateId ? pcs.filter((p) => p.stateId === stateId) : pcs;
  const pcOptions = filteredPcs.map((p) => ({ label: p.name, value: p.id }));
  const filteredAcs = pcId ? acs.filter((a) => a.pcId === pcId) : districtId ? acs.filter((a) => a.districtId === districtId) : acs;
  const acOptions = filteredAcs.map((a) => ({ label: a.name, value: a.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Ward (Prabhag)' : 'Add Ward (Prabhag)'}
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
            setAcId('');
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
            setAcId('');
          }}
          options={districtOptions}
          placeholder="Select District"
        />
        <FormInput
          type="select"
          label="Parliamentary Constituency (PC)"
          value={pcId}
          onChange={(e) => {
            setPcId(e.target.value);
            setAcId('');
          }}
          options={pcOptions}
          placeholder="Select PC"
        />
        <FormInput
          type="select"
          label="Assembly Constituency (AC)"
          value={acId}
          onChange={(e) => setAcId(e.target.value)}
          options={acOptions}
          placeholder="Select AC"
          required
        />
        <FormInput
          type="number"
          label="Ward / Prabhag Number"
          value={wardNumber}
          onChange={(e) => setWardNumber(e.target.value)}
          placeholder="e.g. 12"
          required
        />
        <FormInput
          label="Ward / Prabhag Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ward No. 12 - Shivajinagar"
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
            {submitting ? 'Saving...' : editingItem ? 'Update Ward' : 'Create Ward'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WardFormModal;
