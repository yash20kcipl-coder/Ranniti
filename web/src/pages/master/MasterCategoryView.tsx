import {
  setMasterTab,
  fetchMasterCategoryData,
  createMasterCategoryItem,
  updateMasterCategoryItem,
  deleteMasterCategoryItem,
  syncAllMasters,
} from '@/redux/actions/master';
import toast from 'react-hot-toast';
import { Database } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import React, { useState, useEffect } from 'react';
import { exportToExcel } from '@/utils/exportImport';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/common/DataTable';
import { FormInput } from '@/components/common/FormInput';
import TableActions from '@/components/common/TableActions';
import { PageHeader } from '@/components/common/PageHeader';
import { ImportModal } from '@/components/common/ImportModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { startBulkImportJob } from '@/redux/actions/importJobs';
import type { FilterField } from '@/components/common/FilterBar';
import { masterConfig, type MasterCategoryConfig } from '@/config/masterConfig';
import { CASTE_CATEGORY_OPTIONS, ORGANIZATION_STATUS_OPTIONS } from '@/constants/dropdownOptions';

interface MasterCategoryViewProps {
  categoryKey: string;
}

export const MasterCategoryView: React.FC<MasterCategoryViewProps> = ({ categoryKey }) => {
  const dispatch = useAppDispatch();
  const masterState = useAppSelector((state) => state.master as any);

  const activeTabKey = categoryKey;
  const masterStoreData = masterState[activeTabKey] || [];

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import & Export State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStateId, setFilterStateId] = useState<string>('');
  const [filterPcId, setFilterPcId] = useState<string>('');
  const [filterDistrictId, setFilterDistrictId] = useState<string>('');
  const [filterAcId, setFilterAcId] = useState<string>('');
  const [filterReligionId, setFilterReligionId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAlliance, setFilterAlliance] = useState<string>('');

  const activeConfig: MasterCategoryConfig = masterConfig[activeTabKey] || masterConfig.religions;

  // Reset filters on tab change
  useEffect(() => {
    setSearchTerm('');
    setFilterStateId('');
    setFilterPcId('');
    setFilterDistrictId('');
    setFilterAcId('');
    setFilterReligionId('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterAlliance('');
  }, [activeTabKey]);

  // Sync Redux activeTab with current category
  useEffect(() => {
    if (masterState.activeTab !== activeTabKey) {
      dispatch(setMasterTab(activeTabKey));
    }
  }, [activeTabKey, dispatch, masterState.activeTab]);

  // Unified Debounced API Data Loader
  useDebouncedEffect(
    () => {
      let isMounted = true;
      const loadAllData = async () => {
        setLoading(true);
        try {
          const refKeys = ['states', 'religions', 'castes', 'districts', 'pcs', 'acs'];
          const fetchPromises = refKeys.map((key) => {
            const cfg = masterConfig[key];
            const endpoint = cfg ? cfg.apiEndpoint : `/masters/${key}`;
            return dispatch(fetchMasterCategoryData(key, endpoint, false)).catch(() => { });
          });

          if (activeConfig && !refKeys.includes(activeTabKey)) {
            fetchPromises.push(dispatch(fetchMasterCategoryData(activeTabKey, activeConfig.apiEndpoint, false)).catch(() => { }));
          }

          await Promise.all(fetchPromises);
        } catch {
          // Handled in thunk
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadAllData();
    },
    200,
    [activeTabKey, activeConfig.apiEndpoint]
  );

  // Reference Datasets from Redux Store
  const allStates = masterState.states || [];
  const allDistricts = masterState.districts || [];
  const allPcs = masterState.pcs || [];
  const allAcs = masterState.acs || [];
  const allReligions = masterState.religions || [];

  // Cascading Filter Dropdown Options
  const filteredDistrictsOptions = React.useMemo(() => {
    if (!filterStateId) return allDistricts;
    return allDistricts.filter((d: any) => d.stateId === filterStateId);
  }, [allDistricts, filterStateId]);

  const filteredPcsOptions = React.useMemo(() => {
    if (!filterStateId) return allPcs;
    return allPcs.filter((p: any) => p.stateId === filterStateId);
  }, [allPcs, filterStateId]);

  const filteredAcsOptions = React.useMemo(() => {
    let list = allAcs;
    if (filterPcId) {
      list = list.filter((a: any) => a.pcId === filterPcId);
    } else if (filterStateId) {
      const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === filterStateId).map((p: any) => p.id));
      list = list.filter((a: any) => a.stateId === filterStateId || statePcIds.has(a.pcId));
    }
    return list;
  }, [allAcs, allPcs, filterPcId, filterStateId]);

  // Filtered & Searched Display Dataset
  const displayData = React.useMemo(() => {
    let list = masterStoreData;

    if (activeTabKey === 'castes') {
      if (filterCategory) {
        list = list.filter((item: any) => item.category === filterCategory);
      }
      if (filterReligionId) {
        list = list.filter((item: any) => item.religionId === filterReligionId);
      }
    }

    if (activeTabKey === 'districts' && filterStateId) {
      list = list.filter((item: any) => item.stateId === filterStateId);
    }

    if (activeTabKey === 'pcs' && filterStateId) {
      list = list.filter((item: any) => item.stateId === filterStateId);
    }

    if (activeTabKey === 'acs') {
      if (filterStateId) {
        const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === filterStateId).map((p: any) => p.id));
        list = list.filter((item: any) => item.stateId === filterStateId || statePcIds.has(item.pcId));
      }
      if (filterPcId) {
        list = list.filter((item: any) => item.pcId === filterPcId);
      }
      if (filterDistrictId) {
        list = list.filter((item: any) => item.districtId === filterDistrictId);
      }
    }

    if (activeTabKey === 'booths') {
      if (filterAcId) {
        list = list.filter((item: any) => item.acId === filterAcId);
      } else if (filterPcId) {
        const pcAcIds = new Set(allAcs.filter((a: any) => a.pcId === filterPcId).map((a: any) => a.id));
        list = list.filter((item: any) => pcAcIds.has(item.acId));
      } else if (filterStateId) {
        const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === filterStateId).map((p: any) => p.id));
        const stateAcIds = new Set(allAcs.filter((a: any) => a.stateId === filterStateId || statePcIds.has(a.pcId)).map((a: any) => a.id));
        list = list.filter((item: any) => stateAcIds.has(item.acId));
      }
    }

    if (activeTabKey === 'organizations') {
      if (filterStatus) {
        list = list.filter((item: any) => (item.status || 'active') === filterStatus);
      }
      if (filterAcId) {
        list = list.filter((item: any) => item.acId === filterAcId);
      } else if (filterPcId) {
        const pcAcIds = new Set(allAcs.filter((a: any) => a.pcId === filterPcId).map((a: any) => a.id));
        list = list.filter((item: any) => pcAcIds.has(item.acId));
      } else if (filterStateId) {
        const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === filterStateId).map((p: any) => p.id));
        const stateAcIds = new Set(allAcs.filter((a: any) => a.stateId === filterStateId || statePcIds.has(a.pcId)).map((a: any) => a.id));
        list = list.filter((item: any) => stateAcIds.has(item.acId));
      }
    }

    if (activeTabKey === 'parties' && filterAlliance) {
      list = list.filter((item: any) => (item.alliance || '').toLowerCase() === filterAlliance.toLowerCase());
    }

    // Search keyword filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((row: any) =>
        Object.values(row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    return list;
  }, [masterStoreData, activeTabKey, filterStateId, filterPcId, filterDistrictId, filterAcId, filterReligionId, filterCategory, filterStatus, filterAlliance, searchTerm, allPcs, allAcs]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStateId('');
    setFilterPcId('');
    setFilterDistrictId('');
    setFilterAcId('');
    setFilterReligionId('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterAlliance('');
  };

  const handleAutoSync = async () => {
    setIsSyncing(true);
    try {
      await dispatch(syncAllMasters());
      toast.success('Successfully auto-synced all Master Data tables with backend!');
      await dispatch(fetchMasterCategoryData(activeTabKey, activeConfig.apiEndpoint, false));
    } catch {
      // Handled in thunk
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await dispatch(
          updateMasterCategoryItem(
            activeTabKey,
            activeConfig.apiEndpoint,
            editingItem.id,
            formData
          )
        );
        toast.success(`${activeConfig.label} updated successfully!`);
      } else {
        await dispatch(
          createMasterCategoryItem(activeTabKey, activeConfig.apiEndpoint, formData)
        );
        toast.success(`New ${activeConfig.label} item added successfully!`);
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
      await dispatch(
        deleteMasterCategoryItem(
          activeTabKey,
          activeConfig.apiEndpoint,
          itemToDelete.id
        )
      );
      toast.success(`${activeConfig.label} item deleted successfully!`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkImport = async (records: Record<string, any>[]) => {
    try {
      const response = await dispatch(startBulkImportJob(activeTabKey, records));
      toast.success(
        `Import job initialized successfully! Progress job #${response.jobId} running in background.`,
        { duration: 5000 }
      );
      await dispatch(fetchMasterCategoryData(activeTabKey, activeConfig.apiEndpoint, false));
    } catch (err: any) {
      toast.error(err.message || 'Bulk import job initialization failed');
      throw err;
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

  // Build Filter Fields Configuration for FilterBar & Side Popup Drawer
  const filterFields: FilterField[] = [];

  if (['districts', 'pcs', 'acs', 'booths', 'organizations'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterStateId',
      label: 'State',
      type: 'select',
      value: filterStateId,
      onChange: (val) => {
        setFilterStateId(val);
        setFilterPcId('');
        setFilterDistrictId('');
        setFilterAcId('');
      },
      options: [{ label: 'All States', value: '' }, ...allStates.map((s: any) => ({ label: s.name, value: s.id }))],
      isPrimary: true,
    });
  }

  if (['acs', 'booths', 'organizations'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterPcId',
      label: 'Parliamentary (PC)',
      type: 'select',
      value: filterPcId,
      onChange: (val) => {
        setFilterPcId(val);
        setFilterAcId('');
      },
      options: [{ label: 'All PCs', value: '' }, ...filteredPcsOptions.map((p: any) => ({ label: p.name, value: p.id }))],
      isPrimary: false,
    });
  }

  if (activeTabKey === 'acs') {
    filterFields.push({
      key: 'filterDistrictId',
      label: 'District',
      type: 'select',
      value: filterDistrictId,
      onChange: setFilterDistrictId,
      options: [{ label: 'All Districts', value: '' }, ...filteredDistrictsOptions.map((d: any) => ({ label: d.name, value: d.id }))],
      isPrimary: false,
    });
  }

  if (['booths', 'organizations'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterAcId',
      label: 'Assembly (AC)',
      type: 'select',
      value: filterAcId,
      onChange: setFilterAcId,
      options: [{ label: 'All ACs', value: '' }, ...filteredAcsOptions.map((a: any) => ({ label: a.name, value: a.id }))],
      isPrimary: false,
    });
  }

  if (activeTabKey === 'castes') {
    filterFields.push({
      key: 'filterReligionId',
      label: 'Religion',
      type: 'select',
      value: filterReligionId,
      onChange: setFilterReligionId,
      options: [{ label: 'All Religions', value: '' }, ...allReligions.map((r: any) => ({ label: r.name, value: r.id }))],
      isPrimary: true,
    });
    filterFields.push({
      key: 'filterCategory',
      label: 'Category',
      type: 'select',
      value: filterCategory,
      onChange: setFilterCategory,
      options: CASTE_CATEGORY_OPTIONS,
      isPrimary: true,
    });
  }

  if (activeTabKey === 'organizations') {
    filterFields.push({
      key: 'filterStatus',
      label: 'Status',
      type: 'select',
      value: filterStatus,
      onChange: setFilterStatus,
      options: ORGANIZATION_STATUS_OPTIONS,
      isPrimary: false,
    });
  }

  if (activeTabKey === 'parties') {
    filterFields.push({
      key: 'filterAlliance',
      label: 'Alliance',
      type: 'text',
      value: filterAlliance,
      onChange: setFilterAlliance,
      placeholder: 'Filter by Alliance (e.g. NDA, INDIA)',
      isPrimary: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header Component */}
      <PageHeader
        title={activeConfig.label}
        subtitle={activeConfig.description}
        icon={<Database size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {displayData.length} {displayData.length === 1 ? 'Record' : 'Records'}
          </span>
        }
        onSyncClick={handleAutoSync}
        isSyncing={isSyncing}
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExportExcel}
        onAddClick={handleOpenAddModal}
        addLabel={activeConfig.addLabel || 'Add Record'}
      />

      {/* Filter Bar with Side Popup Drawer */}
      <FilterBar
        searchPlaceholder="Search records..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      {/* Main Data Table */}
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

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingItem ? `Edit ${activeConfig.label}` : `Add New ${activeConfig.label}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeConfig.fields.map((f) => {
              let options = f.options || [];

              if (f.name === 'stateId') {
                options = allStates.map((s: any) => ({ label: s.name, value: s.id }));
              } else if (f.name === 'districtId') {
                const targetState = formData.stateId;
                const stateDistricts = targetState
                  ? allDistricts.filter((d: any) => d.stateId === targetState)
                  : allDistricts;
                options = stateDistricts.map((d: any) => ({ label: d.name, value: d.id }));
              } else if (f.name === 'pcId') {
                const targetState = formData.stateId;
                const statePcs = targetState
                  ? allPcs.filter((p: any) => p.stateId === targetState)
                  : allPcs;
                options = statePcs.map((p: any) => ({ label: p.name, value: p.id }));
              } else if (f.name === 'acId') {
                const targetPc = formData.pcId;
                const pcAcs = targetPc
                  ? allAcs.filter((a: any) => a.pcId === targetPc)
                  : allAcs;
                options = pcAcs.map((a: any) => ({ label: a.name, value: a.id }));
              } else if (f.name === 'religionId') {
                options = allReligions.map((r: any) => ({ label: r.name, value: r.id }));
              } else if (f.name === 'parentCasteId') {
                options = (masterState.castes || [])
                  .filter((c: any) => c.id !== editingItem?.id)
                  .map((c: any) => ({ label: c.name, value: c.id }));
              }

              return (
                <FormInput
                  key={f.name}
                  label={f.label}
                  name={f.name}
                  type={f.type || 'text'}
                  value={formData[f.name] ?? ''}
                  onChange={(e) => handleFormChange(f.name, (e.target as any)?.value ?? e)}
                  options={options}
                  required={f.required}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {editingItem ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reusable Confirm Modal for Deletion */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${activeConfig.label}`}
        description={`Are you sure you want to delete this ${activeConfig.label.toLowerCase()} entry? This operation cannot be undone.`}
        itemName={itemToDelete?.name || itemToDelete?.epicNo || itemToDelete?.id}
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Bulk Excel Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={`Import ${activeConfig.label}`}
        categoryKey={activeTabKey}
        fields={activeConfig.fields}
        onImport={handleBulkImport}
      />
    </div>
  );
};

export default MasterCategoryView;
