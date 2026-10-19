import {
  FORM_ELECTION_TYPE_OPTIONS,
  FORM_ELECTION_STATUS_OPTIONS,
} from '@/constants/dropdownOptions';
import { Modal } from '@/components/common/Modal';
import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/common/FormInput';
import type { Election, CreateElectionPayload, UpdateElectionPayload } from '@/types/election.types';

interface ElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateElectionPayload | UpdateElectionPayload) => Promise<void>;
  initialData?: Election | null;
  isSaving?: boolean;
}

export const ElectionModal: React.FC<ElectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    electionCode: '',
    electionType: 'ASSEMBLY',
    electionDate: '',
    countingDate: '',
    status: 'UPCOMING',
    isActive: true,
    isDefault: false,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        electionCode: initialData.electionCode || '',
        electionType: initialData.electionType || 'ASSEMBLY',
        electionDate: initialData.electionDate || '',
        countingDate: initialData.countingDate || '',
        status: initialData.status || 'UPCOMING',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        isDefault: Boolean(initialData.isDefault),
        description: initialData.description || '',
      });
    } else {
      setFormData({
        name: '',
        electionCode: '',
        electionType: 'ASSEMBLY',
        electionDate: '',
        countingDate: '',
        status: 'UPCOMING',
        isActive: true,
        isDefault: false,
        description: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field: string, valOrEvent: any) => {
    const value =
      valOrEvent && typeof valOrEvent === 'object' && 'target' in valOrEvent
        ? valOrEvent.target.value
        : valOrEvent;

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-compute recommended campaign status based on polling & counting dates
      if (field === 'electionDate' || field === 'countingDate') {
        const pDate = field === 'electionDate' ? value : prev.electionDate;
        const cDate = field === 'countingDate' ? value : prev.countingDate;
        if (pDate) {
          const today = new Date().toISOString().split('T')[0];
          const endDate = cDate || pDate;
          if (today < pDate) {
            next.status = 'UPCOMING';
          } else if (today <= endDate) {
            next.status = 'ACTIVE';
          } else {
            next.status = 'COMPLETED';
          }
        }
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Election name is required';
    }
    if (!formData.electionDate) {
      newErrors.electionDate = 'Polling date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateElectionPayload = {
      name: formData.name.trim(),
      electionCode: formData.electionCode.trim() || undefined,
      electionType: formData.electionType,
      electionDate: formData.electionDate,
      countingDate: formData.countingDate || undefined,
      status: formData.status,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
      description: formData.description.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Election' : 'Add New Election'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          name="name"
          label="Election Name *"
          placeholder="e.g. Maharashtra Vidhan Sabha 2024"
          value={formData.name}
          onChange={(val) => handleChange('name', val)}
          error={errors.name}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="electionCode"
            label="Election Code"
            placeholder="e.g. VS-2024"
            value={formData.electionCode}
            onChange={(val) => handleChange('electionCode', val)}
          />

          <FormInput
            name="electionType"
            type="select"
            label="Election Type *"
            value={formData.electionType}
            onChange={(val) => handleChange('electionType', val)}
            options={FORM_ELECTION_TYPE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            name="electionDate"
            type="date"
            label="Polling Date *"
            value={formData.electionDate}
            onChange={(val) => handleChange('electionDate', val)}
            error={errors.electionDate}
          />

          <FormInput
            name="countingDate"
            type="date"
            label="Counting / Results Date"
            value={formData.countingDate}
            onChange={(val) => handleChange('countingDate', val)}
          />

          <FormInput
            name="status"
            type="select"
            label="Campaign Status"
            value={formData.status}
            onChange={(val) => handleChange('status', val)}
            options={FORM_ELECTION_STATUS_OPTIONS}
          />
        </div>

        <FormInput
          name="description"
          type="textarea"
          label="Notes / Campaign Objectives"
          placeholder="Optional notes, constituency key priorities, or campaign agenda..."
          value={formData.description}
          onChange={(val) => handleChange('description', val)}
          rows={3}
        />

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Active Campaign
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mark whether this election cycle is actively monitored by your team
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                Set as Default Election (Live Polling Turnout)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Default election is automatically resolved by Polling Date (current/closest upcoming election). Check this to manually pin this election as the active campaign.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => handleChange('isDefault', e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer shrink-0 mt-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : initialData ? 'Update Election' : 'Create Election'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
