import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTenantUsers } from '@/redux/actions/tenant';
import { assignElectionToTenants, unassignElectionFromTenant } from '@/redux/actions/superAdminElection';
import type { SuperAdminElection } from '@/types/election.types';
import { Search, Check, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssignTenantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: SuperAdminElection | null;
}

export const AssignTenantsModal: React.FC<AssignTenantsModalProps> = ({
  isOpen,
  onClose,
  election,
}) => {
  const dispatch = useAppDispatch();
  const tenants = useAppSelector((state) => state.tenant.tenants || []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchTenantUsers(false));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (election && isOpen) {
      const assigned = election.assignedTenants ? election.assignedTenants.map((t) => t.id) : [];
      setSelectedIds(assigned);
      setInitialIds(assigned);
    } else {
      setSelectedIds([]);
      setInitialIds([]);
    }
    setSearch('');
  }, [election, isOpen]);

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase().trim();
    return tenants.filter(
      (t: any) =>
        t.name?.toLowerCase().includes(q) ||
        t.organizationName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const toggleTenant = (tenantId: string) => {
    setSelectedIds((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const handleSave = async () => {
    if (!election) return;
    setIsSubmitting(true);
    try {
      const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
      const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

      if (toAdd.length > 0) {
        await dispatch(assignElectionToTenants(election.id, toAdd));
      }

      if (toRemove.length > 0) {
        for (const tenantId of toRemove) {
          const tenant = tenants.find((t: any) => t.id === tenantId);
          await dispatch(unassignElectionFromTenant(election.id, tenantId, tenant?.tenantDbName));
        }
      }

      toast.success('Tenant assignments updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update tenant assignments');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Tenants — ${election?.name || 'Election'}`}
      maxWidth="md"
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Select organizations that are contesting or managing this election.</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {selectedIds.length} Selected
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations or administrators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Tenants List */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700/60 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/50">
          {filteredTenants.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No tenant accounts found
            </div>
          ) : (
            filteredTenants.map((t: any) => {
              const isSelected = selectedIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTenant(t.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all border text-left ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{t.organizationName || t.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.name} • {t.email}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
