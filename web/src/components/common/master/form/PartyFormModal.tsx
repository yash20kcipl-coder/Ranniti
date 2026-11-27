import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import { Check } from 'lucide-react';
import { formatTitleCase } from '@/utils/textUtils';

interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onSave: (data: Record<string, any>) => Promise<void>;
}

const PRESET_PARTY_COLORS = [
  { label: 'Saffron / Orange', value: '#ea580c', party: 'BJP' },
  { label: 'Congress Blue', value: '#0284c7', party: 'INC' },
  { label: 'AAP Cyan', value: '#06b6d4', party: 'AAP' },
  { label: 'Grassroot Green', value: '#16a34a', party: 'TMC / JD(U)' },
  { label: 'Royal Blue', value: '#2563eb', party: 'BSP / VBA' },
  { label: 'Crimson Red', value: '#dc2626', party: 'DMK / CPI' },
  { label: 'Bright Red', value: '#ef4444', party: 'SP' },
  { label: 'Amber Yellow', value: '#f59e0b', party: 'TDP / SAD' },
  { label: 'Bright Orange', value: '#f97316', party: 'SHS' },
  { label: 'Purple', value: '#7c3aed', party: 'NCP' },
  { label: 'Rose Pink', value: '#e11d48', party: 'BRS' },
  { label: 'Maroon', value: '#991b1b', party: 'CPI(M)' },
  { label: 'Forest Green', value: '#15803d', party: 'RJD' },
  { label: 'Emerald Green', value: '#059669', party: 'AIADMK' },
  { label: 'Neutral Slate', value: '#64748b', party: 'IND' },
];

export const PartyFormModal: React.FC<PartyFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [alliance, setAlliance] = useState('');
  const [color, setColor] = useState('#ea580c');
  const [symbolLogo, setSymbolLogo] = useState<File | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setAbbreviation(editingItem.abbreviation || '');
      setAlliance(editingItem.alliance || '');
      setColor(editingItem.color || '#ea580c');
      setSymbolLogo(editingItem.symbolLogo || null);
    } else {
      setName('');
      setAbbreviation('');
      setAlliance('');
      setColor('#ea580c');
      setSymbolLogo(null);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: formatTitleCase(name.trim()),
        abbreviation: abbreviation.trim().toUpperCase(),
        alliance: alliance.trim() ? formatTitleCase(alliance.trim()) : '',
        color: color || '#ea580c',
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
          label="Party Code"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder="e.g. BJP"
          required
        />

        {/* Party Color Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Party Theme Color
            </label>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                {color}
              </span>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {PRESET_PARTY_COLORS.map((preset) => {
              const isSelected = color.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  title={`${preset.party} (${preset.label}) - ${preset.value}`}
                  className={`group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                    style={{ backgroundColor: preset.value }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={3} />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 truncate max-w-full">
                    {preset.party.split('/')[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Color Input & Preview */}
          <div className="flex items-center gap-3 pt-1">
            <div className="relative flex items-center">
              <input
                type="color"
                value={color.startsWith('#') && color.length === 7 ? color : '#ea580c'}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer bg-white dark:bg-slate-800 shadow-xs"
                title="Choose custom color"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#HEX code (e.g. #ea580c)"
                maxLength={9}
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            {/* Live Badge Preview */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Preview:</span>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs"
                style={{ backgroundColor: color }}
              >
                {abbreviation || name || 'PARTY'}
              </span>
            </div>
          </div>
        </div>

        <FormInput
          label="Alliance Name (Optional)"
          value={alliance}
          onChange={(e) => setAlliance(e.target.value)}
          placeholder="e.g. NDA / INDIA"
        />
        <FileUploadInput
          label="Party Logo"
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
