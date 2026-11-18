import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { useMasterData } from '@/hooks/useMasterData';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTenantUsers } from '@/redux/actions/tenant';
import {
  FORM_ELECTION_TYPE_OPTIONS,
  FORM_ELECTION_STATUS_OPTIONS,
} from '@/constants/dropdownOptions';
import type {
  SuperAdminElection,
  CreateSuperAdminElectionPayload,
  UpdateSuperAdminElectionPayload,
} from '@/types/election.types';
import { Search, Check, Users } from 'lucide-react';

interface SuperAdminElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSuperAdminElectionPayload | UpdateSuperAdminElectionPayload) => Promise<void>;
  initialData?: SuperAdminElection | null;
  isSaving?: boolean;
}

export const SuperAdminElectionModal: React.FC<SuperAdminElectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSaving = false,
}) => {
  const dispatch = useAppDispatch();
  const { states = [], pcs = [], acs = [] } = useMasterData(['states', 'pcs', 'acs']);
  const tenants = useAppSelector((state) => state.tenant.tenants || []);

  const [formData, setFormData] = useState({
    name: '',
    electionCode: '',
    electionType: 'ASSEMBLY',
    electionDate: '',
    countingDate: '',
    stateId: '',
    pcId: '',
    acId: '',
    status: 'UPCOMING',
    isActive: true,
    totalVotersSnapshot: 0,
    targetVotes: 0,
    description: '',
    tenantIds: [] as string[],
  });

  const [tenantSearch, setTenantSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchTenantUsers(false));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        electionCode: initialData.electionCode || '',
        electionType: initialData.electionType || 'ASSEMBLY',
        electionDate: initialData.electionDate || '',
        countingDate: initialData.countingDate || '',
        stateId: initialData.stateId || '',
        pcId: initialData.pcId || '',
        acId: initialData.acId || '',
        status: initialData.status || 'UPCOMING',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        totalVotersSnapshot: initialData.totalVotersSnapshot || 0,
        targetVotes: initialData.targetVotes || 0,
        description: initialData.description || '',
        tenantIds: initialData.assignedTenants ? initialData.assignedTenants.map((t) => t.id) : [],
      });
    } else {
      setFormData({
        name: '',
        electionCode: '',
        electionType: 'ASSEMBLY',
        electionDate: '',
        countingDate: '',
        stateId: '',
        pcId: '',
        acId: '',
        status: 'UPCOMING',
        isActive: true,
        totalVotersSnapshot: 0,
        targetVotes: 0,
        description: '',
        tenantIds: [],
      });
    }
    setTenantSearch('');
    setErrors({});
  }, [initialData, isOpen]);

  // Cascading options
  const stateOptions = useMemo(
    () => [{ label: 'Select State (Optional)', value: '' }, ...states.map((s: any) => ({ label: s.name, value: s.id }))],
    [states]
  );

  const pcOptions = useMemo(() => {
    let filtered = pcs;
    if (formData.stateId) {
      filtered = filtered.filter((p: any) => p.stateId === formData.stateId);
    }
    return [{ label: 'Select PC (Optional)', value: '' }, ...filtered.map((p: any) => ({ label: p.name, value: p.id }))];
  }, [pcs, formData.stateId]);

  const acOptions = useMemo(() => {
    let filtered = acs;
    if (formData.pcId) {
      filtered = filtered.filter((a: any) => a.pcId === formData.pcId);
    } else if (formData.stateId) {
      filtered = filtered.filter((a: any) => a.stateId === formData.stateId);
    }
    return [{ label: 'Select AC (Optional)', value: '' }, ...filtered.map((a: any) => ({ label: a.name, value: a.id }))];
  }, [acs, formData.pcId, formData.stateId]);

  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const q = tenantSearch.toLowerCase().trim();
    return tenants.filter(
      (t: any) =>
        t.name?.toLowerCase().includes(q) ||
        t.organizationName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q)
    );
  }, [tenants, tenantSearch]);

  const handleChange = (field: string, valOrEvent: any) => {
    const value =
      valOrEvent && typeof valOrEvent === 'object' && 'target' in valOrEvent
        ? valOrEvent.target.value
        : valOrEvent;

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'stateId') {
        next.pcId = '';
        next.acId = '';
      }
      if (field === 'pcId') {
        next.acId = '';
      }
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

  const toggleTenant = (tenantId: string) => {
    setFormData((prev) => {
      const exists = prev.tenantIds.includes(tenantId);
      const nextIds = exists
        ? prev.tenantIds.filter((id) => id !== tenantId)
        : [...prev.tenantIds, tenantId];
      return { ...prev, tenantIds: nextIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Election title is required';
    }
    if (!formData.electionDate) {
      newErrors.electionDate = 'Polling date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: CreateSuperAdminElectionPayload = {
      name: formData.name.trim(),
      electionCode: formData.electionCode.trim() || undefined,
      electionType: formData.electionType,
      electionDate: formData.electionDate,
      countingDate: formData.countingDate || undefined,
      stateId: formData.stateId || undefined,
      pcId: formData.pcId || undefined,
      acId: formData.acId || undefined,
      status: formData.status,
      isActive: formData.isActive,
      totalVotersSnapshot: Number(formData.totalVotersSnapshot) || 0,
      targetVotes: Number(formData.targetVotes) || 0,
      description: formData.description.trim() || undefined,
      tenantIds: formData.tenantIds,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Master Election' : 'Create Master Election'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name & Code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <FormInput
              label="Election Title"
              placeholder="e.g. Maharashtra Vidhan Sabha 2024"
              value={formData.name}
              onChange={(val) => handleChange('name', val)}
              error={errors.name}
              required
            />
          </div>
          <div>
            <FormInput
              label="Identifier Code"
              placeholder="e.g. MH-VS-2024"
              value={formData.electionCode}
              onChange={(val) => handleChange('electionCode', val)}
            />
          </div>
        </div>

        {/* Row 2: Type, Polling Date, Counting Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <FormInput
              type="select"
              label="Election Type"
              value={formData.electionType}
              onChange={(val) => handleChange('electionType', val)}
              options={FORM_ELECTION_TYPE_OPTIONS}
              required
            />
          </div>
          <div>
            <FormInput
              type="date"
              label="Polling Date"
              value={formData.electionDate}
              onChange={(val) => handleChange('electionDate', val)}
              error={errors.electionDate}
              required
            />
          </div>
          <div>
            <FormInput
              type="date"
              label="Counting Date"
              value={formData.countingDate}
              onChange={(val) => handleChange('countingDate', val)}
            />
          </div>
        </div>

        {/* Row 3: Geographic Scope (State, PC, AC) */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Geographic Scope (Optional)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <FormInput
                type="select"
                label="State"
                value={formData.stateId}
                onChange={(val) => handleChange('stateId', val)}
                options={stateOptions}
              />
            </div>
            <div>
              <FormInput
                type="select"
                label="Parliamentary (PC)"
                value={formData.pcId}
                onChange={(val) => handleChange('pcId', val)}
                options={pcOptions}
              />
            </div>
            <div>
              <FormInput
                type="select"
                label="Assembly (AC)"
                value={formData.acId}
                onChange={(val) => handleChange('acId', val)}
                options={acOptions}
              />
            </div>
          </div>
        </div>

        {/* Row 4: Status & Target Votes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <FormInput
              type="select"
              label="Lifecycle Status"
              value={formData.status}
              onChange={(val) => handleChange('status', val)}
              options={FORM_ELECTION_STATUS_OPTIONS}
              required
            />
          </div>
          <div>
            <FormInput
              type="number"
              label="Winning Target Votes"
              placeholder="e.g. 85000"
              value={String(formData.targetVotes || '')}
              onChange={(val) => handleChange('targetVotes', val)}
            />
          </div>
          <div>
            <FormInput
              type="number"
              label="Electorate Snapshot"
              placeholder="e.g. 275000"
              value={String(formData.totalVotersSnapshot || '')}
              onChange={(val) => handleChange('totalVotersSnapshot', val)}
            />
          </div>
        </div>

        {/* Row 5: Assigned Tenants Selection */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Assign to Tenants ({formData.tenantIds.length} selected)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Synced automatically to assigned tenant DBs
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant accounts..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-700/60 rounded-md bg-white dark:bg-slate-900/60 p-1.5">
            {filteredTenants.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No tenants found</p>
            ) : (
              filteredTenants.map((t: any) => {
                const isSelected = formData.tenantIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTenant(t.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{t.organizationName || t.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {t.name} • {t.email}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Row 6: Active Switch & Description */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Active Election</p>
            <p className="text-[11px] text-slate-400">
              Controls whether this election is active in campaign workflows
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('isActive', !formData.isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              formData.isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                formData.isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <FormInput
            type="textarea"
            label="Description & Campaign Notes"
            placeholder="Key election notes, manifesto targets, coalition details..."
            value={formData.description}
            onChange={(val) => handleChange('description', val)}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : initialData ? 'Update Election' : 'Create Election'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
