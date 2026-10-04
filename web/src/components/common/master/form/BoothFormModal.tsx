import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';

interface BoothFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  states: any[];
  districts: any[];
  pcs: any[];
  acs: any[];
  wards: any[];
  onSave: (data: { name: string; boothNumber: number | string; acId: string; wardId?: string; totalVoters?: number }) => Promise<void>;
}

export const BoothFormModal: React.FC<BoothFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  states,
  districts,
  pcs,
  acs,
  wards,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [boothNumber, setBoothNumber] = useState<string | number>('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [pcId, setPcId] = useState('');
  const [acId, setAcId] = useState('');
  const [wardId, setWardId] = useState('');
  const [totalVoters, setTotalVoters] = useState<string | number>('');
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
      setBoothNumber(editingItem.boothNumber ?? '');
      setStateId(derivedStateId);
      setDistrictId(derivedDistrictId);
      setPcId(derivedPcId);
      setAcId(editingItem.acId || '');
      setWardId(editingItem.wardId || '');
      setTotalVoters(editingItem.totalVoters ?? '');
    } else {
      setName('');
      setBoothNumber('');
      setStateId('');
      setDistrictId('');
      setPcId('');
      setAcId('');
      setWardId('');
      setTotalVoters('');
    }
  }, [editingItem, isOpen, acs, pcs, districts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        name,
        boothNumber: Number(boothNumber),
        acId,
        wardId,
        totalVoters: totalVoters ? Number(totalVoters) : 0,
      });
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
  const filteredWards = acId ? wards.filter((w) => w.acId === acId) : wards;
  const wardOptions = filteredWards.map((w) => ({ label: w.name, value: w.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Polling Booth' : 'Add Polling Booth'}
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
            setWardId('');
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
            setWardId('');
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
            setWardId('');
          }}
          options={pcOptions}
          placeholder="Select PC"
        />
        <FormInput
          type="select"
          label="Assembly Constituency (AC)"
          value={acId}
          onChange={(e) => {
            setAcId(e.target.value);
            setWardId('');
          }}
          options={acOptions}
          placeholder="Select AC"
          required
        />
        <FormInput
          type="select"
          label="Ward / Prabhag (Optional)"
          value={wardId}
          onChange={(e) => setWardId(e.target.value)}
          options={wardOptions}
          placeholder="Select Ward"
        />
        <FormInput
          type="number"
          label="Booth Number"
          value={boothNumber}
          onChange={(e) => setBoothNumber(e.target.value)}
          placeholder="e.g. 104"
          required
        />
        <FormInput
          label="Polling Station Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Z.P. Primary School, Room No. 1"
          required
        />
        <FormInput
          type="number"
          label="Total Registered Voters"
          value={totalVoters}
          onChange={(e) => setTotalVoters(e.target.value)}
          placeholder="e.g. 1250"
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
            {submitting ? 'Saving...' : editingItem ? 'Update Booth' : 'Create Booth'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BoothFormModal;
