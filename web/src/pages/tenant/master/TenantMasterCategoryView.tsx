/**
 * TenantMasterCategoryView
 *
 * Dedicated master-data CRUD view for tenant users.
 * Functionally mirrors MasterCategoryView but ALL API calls —
 * both the active tab data and reference/dropdown data (ACs, Wards) —
 * are routed through /tenant-api/* so they are scoped to the tenant's
 * assigned records only.
 *
 * Reference keys that are global (states, districts, pcs) still fall back
 * to /masters/* since they are read-only lookup tables shared across tenants.
 */
import {
  fetchMasterCategoryData,
  createMasterCategoryItem,
  updateMasterCategoryItem,
  deleteMasterCategoryItem,
} from '@/redux/actions/master';
import toast from 'react-hot-toast';
import { Database } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import React, { useState, useEffect } from 'react';
import { exportToExcel } from '@/utils/exportImport';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/common/DataTable';
import { FormInput } from '@/components/common/FormInput';
import TableActions from '@/components/common/TableActions';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import type { FilterField } from '@/components/common/FilterBar';
import { masterConfig, tenantMasterConfig, type MasterCategoryConfig } from '@/config/masterConfig';

/**
 * Endpoints used by tenant for reference dropdown data.
 * ACs and Wards are tenant-scoped; States, Districts, PCs are global lookups.
 */
const TENANT_REF_ENDPOINTS: Record<string, string> = {
  acs: API_ENDPOINTS.TENANT.MASTERS.ACS,
  wards: API_ENDPOINTS.TENANT.MASTERS.WARDS,
};

interface TenantMasterCategoryViewProps {
  /** 'acs' | 'wards' | 'booths' */
  categoryKey: string;
}

export const TenantMasterCategoryView: React.FC<TenantMasterCategoryViewProps> = ({ categoryKey }) => {
  const dispatch = useAppDispatch();
  const masterState = useAppSelector((state) => state.master as any);

  const activeTabKey = categoryKey;
  const masterStoreData = masterState[activeTabKey] || [];

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterPcId, setFilterPcId] = useState<string>('');
  const [filterAcId, setFilterAcId] = useState<string>('');
  const [filterWardId, setFilterWardId] = useState<string>('');

  // Active config: always from tenantMasterConfig (AC/Ward/Booth with /tenant-api/* endpoints)
  const activeConfig: MasterCategoryConfig = tenantMasterConfig[activeTabKey] ?? tenantMasterConfig.acs;

  // Reset filters on tab change
  useEffect(() => {
    setSearchTerm('');
    setFilterPcId('');
    setFilterAcId('');
    setFilterWardId('');
  }, [activeTabKey]);

  // Debounced API Data Loader — uses tenant endpoints for ACs & Wards
  useDebouncedEffect(
    () => {
      const loadAllData = async () => {
        setLoading(true);
        try {
          const fetchPromises: Promise<any>[] = [];

          // Global read-only reference tables — safe to use /masters/*
          const globalRefKeys = ['states', 'districts', 'pcs'] as const;
          for (const key of globalRefKeys) {
            const existing = (masterState as any)[key];
            if (!existing || existing.length === 0) {
              const cfg = masterConfig[key];
              const endpoint = cfg ? cfg.apiEndpoint : `/masters/${key}`;
              fetchPromises.push(dispatch(fetchMasterCategoryData(key, endpoint, false)).catch(() => { }));
            }
          }

          // Tenant-scoped reference tables — must use /tenant-api/*
          const tenantRefKeys = ['acs', 'wards'] as const;
          for (const key of tenantRefKeys) {
            const existing = (masterState as any)[key];
            if (!existing || existing.length === 0) {
              const endpoint = TENANT_REF_ENDPOINTS[key];
              fetchPromises.push(dispatch(fetchMasterCategoryData(key, endpoint, false)).catch(() => { }));
            }
          }

          // Always re-fetch the active tab data
          fetchPromises.push(
            dispatch(fetchMasterCategoryData(activeTabKey, activeConfig.apiEndpoint, false)).catch(() => { })
          );

          if (fetchPromises.length > 0) await Promise.all(fetchPromises);
        } finally {
          setLoading(false);
        }
      };
      loadAllData();
    },
    200,
    [activeTabKey, activeConfig.apiEndpoint]
  );

  // Reference Datasets from Redux Store
  const allPcs = masterState.pcs || [];
  const allAcs = masterState.acs || [];
  const allWards = masterState.wards || [];

  // Cascading dropdown options
  const filteredAcsOptions = React.useMemo(() => {
    if (!filterPcId) return allAcs;
    return allAcs.filter((a: any) => a.pcId === filterPcId);
  }, [allAcs, filterPcId]);

  const filteredWardsOptions = React.useMemo(() => {
    if (!filterAcId) return allWards;
    return allWards.filter((w: any) => w.acId === filterAcId);
  }, [allWards, filterAcId]);

  // Filtered & Searched Display Dataset
  const displayData = React.useMemo(() => {
    let list = masterStoreData;

    if (activeTabKey === 'acs' && filterPcId) {
      list = list.filter((item: any) => item.pcId === filterPcId);
    }

    if (activeTabKey === 'wards') {
      if (filterPcId) {
        const pcAcIds = new Set(allAcs.filter((a: any) => a.pcId === filterPcId).map((a: any) => a.id));
        list = list.filter((item: any) => pcAcIds.has(item.acId));
      }
      if (filterAcId) {
        list = list.filter((item: any) => item.acId === filterAcId);
      }
    }

    if (activeTabKey === 'booths') {
      if (filterAcId) {
        list = list.filter((item: any) => item.acId === filterAcId);
      } else if (filterPcId) {
        const pcAcIds = new Set(allAcs.filter((a: any) => a.pcId === filterPcId).map((a: any) => a.id));
        list = list.filter((item: any) => pcAcIds.has(item.acId));
      }
      if (filterWardId) {
        list = list.filter((item: any) => item.wardId === filterWardId);
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((row: any) =>
        Object.values(row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    return list;
  }, [masterStoreData, activeTabKey, filterPcId, filterAcId, filterWardId, searchTerm, allAcs]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterPcId('');
    setFilterAcId('');
    setFilterWardId('');
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    const prefilledData = { ...item };
    if (item.acId && !prefilledData.pcId) {
      const parentAc = allAcs.find((a: any) => a.id === item.acId);
      if (parentAc?.pcId) prefilledData.pcId = parentAc.pcId;
    }
    if (item.wardId && !prefilledData.acId) {
      const parentWard = allWards.find((w: any) => w.id === item.wardId);
      if (parentWard?.acId) prefilledData.acId = parentWard.acId;
    }
    setFormData(prefilledData);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (fieldKey: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [fieldKey]: value };

      // If PC changes, clear AC and Ward
      if (fieldKey === 'pcId') {
        updated.acId = '';
        updated.wardId = '';
      }

      // If AC is selected, auto-fill PC
      if (fieldKey === 'acId' && value) {
        const selectedAc = allAcs.find((a: any) => a.id === value);
        if (selectedAc?.pcId && !updated.pcId) updated.pcId = selectedAc.pcId;
      }

      // If Ward is selected in Booth form, auto-fill AC (and PC)
      if (fieldKey === 'wardId' && value) {
        const selectedWard = allWards.find((w: any) => w.id === value);
        if (selectedWard?.acId) {
          updated.acId = selectedWard.acId;
          const selectedAc = allAcs.find((a: any) => a.id === selectedWard.acId);
          if (selectedAc?.pcId && !updated.pcId) updated.pcId = selectedAc.pcId;
        }
      }

      return updated;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await dispatch(updateMasterCategoryItem(activeTabKey, activeConfig.apiEndpoint, editingItem.id, formData));
        toast.success(`${activeConfig.label} updated successfully!`);
      } else {
        await dispatch(createMasterCategoryItem(activeTabKey, activeConfig.apiEndpoint, formData));
        toast.success(`New ${activeConfig.label} added successfully!`);
      }
      handleModalClose();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleOpenDeleteModal = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteMasterCategoryItem(activeTabKey, activeConfig.apiEndpoint, itemToDelete.id));
      toast.success(`${activeConfig.label} deleted successfully!`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    if (!displayData || displayData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = displayData.map((item: any) => {
      const row: Record<string, any> = {};
      activeConfig.fields.forEach((f) => {
        const nameProp = f.name.endsWith('Id') ? f.name.replace(/Id$/, 'Name') : null;
        const val = (nameProp && item[nameProp] !== undefined && item[nameProp] !== null && item[nameProp] !== '')
          ? item[nameProp]
          : (item[f.name] ?? '');
        row[f.label] = val;
      });
      return row;
    });
    exportToExcel(cleanData, `${activeConfig.label.replace(/\s+/g, '_')}_Export`);
    toast.success('Excel spreadsheet generated successfully!');
  };

  // Filter bar configuration — only AC/Ward/Booth-relevant filters
  const filterFields: FilterField[] = [];

  if (['acs', 'wards', 'booths'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterPcId',
      label: 'Parliamentary (PC)',
      type: 'select',
      value: filterPcId,
      onChange: (val) => { setFilterPcId(val); setFilterAcId(''); setFilterWardId(''); },
      options: [{ label: 'All PCs', value: '' }, ...allPcs.map((p: any) => ({ label: p.name, value: p.id }))],
      isPrimary: activeTabKey === 'acs',
    });
  }

  if (['wards', 'booths'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterAcId',
      label: 'Assembly (AC)',
      type: 'select',
      value: filterAcId,
      onChange: (val) => { setFilterAcId(val); setFilterWardId(''); },
      options: [{ label: 'All ACs', value: '' }, ...filteredAcsOptions.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id }))],
      isPrimary: activeTabKey === 'wards',
    });
  }

  if (activeTabKey === 'booths') {
    filterFields.push({
      key: 'filterWardId',
      label: 'Ward / Prabhag',
      type: 'select',
      value: filterWardId,
      onChange: setFilterWardId,
      options: [{ label: 'All Wards', value: '' }, ...filteredWardsOptions.map((w: any) => ({ label: `${w.wardNumber ? `#${w.wardNumber} - ` : ''}${w.name}`, value: w.id }))],
      isPrimary: true,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeConfig.label}
        subtitle={activeConfig.description}
        icon={<Database size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {displayData.length} {displayData.length === 1 ? 'Record' : 'Records'}
          </span>
        }
        onExportClick={handleExportExcel}
        onAddClick={handleOpenAddModal}
        addLabel={activeConfig.addLabel || 'Add Record'}
      />

      <FilterBar
        searchPlaceholder="Search records..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl dark:bg-slate-900/60 dark:border dark:border-slate-800 dark:p-1">
        <DataTable
          columns={activeConfig.columns}
          data={displayData}
          loading={loading}
          showHeader={false}
          actions={(row) => (
            <TableActions
              onEdit={() => handleOpenEditModal(row)}
              onDelete={() => handleOpenDeleteModal(row)}
            />
          )}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        maxWidth="2xl"
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingItem ? `Edit ${activeConfig.label}` : `Add New ${activeConfig.label}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeConfig.fields.map((f) => {
              let options = f.options || [];

              if (f.name === 'pcId') {
                options = allPcs.map((p: any) => ({ label: p.name, value: p.id }));
              } else if (f.name === 'acId') {
                const targetPc = formData.pcId;
                const pcAcs = targetPc ? allAcs.filter((a: any) => a.pcId === targetPc) : allAcs;
                options = pcAcs.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id }));
              } else if (f.name === 'wardId') {
                const targetAc = formData.acId;
                const acWards = targetAc ? allWards.filter((w: any) => w.acId === targetAc) : allWards;
                options = acWards.map((w: any) => ({ label: `${w.wardNumber ? `#${w.wardNumber} - ` : ''}${w.name}`, value: w.id }));
              }

              const isFullWidth = f.fullWidth || f.type === 'textarea';
              const rows = f.rows || (f.type === 'textarea' ? 2 : undefined);

              return (
                <div key={f.name} className={isFullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'}>
                  <FormInput
                    label={f.label}
                    name={f.name}
                    type={f.type || 'text'}
                    rows={rows}
                    value={formData[f.name] ?? ''}
                    onChange={(e) => handleFormChange(f.name, (e.target as any)?.value ?? e)}
                    options={options}
                    required={f.required}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-600/25"
            >
              {editingItem ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title={`Delete ${activeConfig.label}`}
        description={`Are you sure you want to delete this ${activeConfig.label} record? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantMasterCategoryView;
