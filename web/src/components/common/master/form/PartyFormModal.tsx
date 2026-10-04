import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';

interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onSave: (data: Record<string, any>) => Promise<void>;
}

export const PartyFormModal: React.FC<PartyFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [alliance, setAlliance] = useState('');
  const [symbolLogo, setSymbolLogo] = useState<File | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setAbbreviation(editingItem.abbreviation || '');
      setAlliance(editingItem.alliance || '');
      setSymbolLogo(editingItem.symbolLogo || null);
    } else {
      setName('');
      setAbbreviation('');
      setAlliance('');
      setSymbolLogo(null);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name,
        abbreviation,
        alliance,
      };
      if (symbolLogo) {
        payload.symbolLogo = symbolLogo;
      }
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Political Party' : 'Add Political Party'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Party Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bharatiya Janata Party"
          required
        />
        <FormInput
          label="Abbreviation / Code"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder="e.g. BJP"
          required
        />
        <FormInput
          label="Alliance Name (Optional)"
          value={alliance}
          onChange={(e) => setAlliance(e.target.value)}
          placeholder="e.g. NDA / INDIA"
        />
        <FileUploadInput
          label="Symbol / Party Logo"
          name="symbolLogo"
          value={symbolLogo}
          onChange={(val) => setSymbolLogo(val)}
          fallbackText={abbreviation || name || 'PT'}
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
            {submitting ? 'Saving...' : editingItem ? 'Update Party' : 'Create Party'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PartyFormModal;
