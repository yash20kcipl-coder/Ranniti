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
import { CASTE_CATEGORY_OPTIONS } from '@/constants/dropdownOptions';
import { masterConfig, type MasterCategoryConfig } from '@/config/masterConfig';

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
  const [filterTalukaId, setFilterTalukaId] = useState<string>('');
  const [filterAcId, setFilterAcId] = useState<string>('');
  const [filterWardId, setFilterWardId] = useState<string>('');
  const [filterReligionId, setFilterReligionId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAlliance, setFilterAlliance] = useState<string>('');

  const activeConfig: MasterCategoryConfig = masterConfig[activeTabKey] ?? masterConfig.religions;

  // Reset filters on tab change
  useEffect(() => {
    setSearchTerm('');
    setFilterStateId('');
    setFilterPcId('');
    setFilterDistrictId('');
    setFilterTalukaId('');
    setFilterAcId('');
    setFilterWardId('');
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
          const refKeys = ['states', 'religions', 'castes', 'districts', 'talukas', 'villages', 'pcs', 'acs', 'wards'];
          const fetchPromises: Promise<any>[] = [];

          // Only fetch reference datasets if they are not already loaded in Redux
          for (const key of refKeys) {
            const existing = (masterState as any)[key];
            if (!existing || existing.length === 0) {
              const cfg = masterConfig[key];
              const endpoint = cfg ? cfg.apiEndpoint : `/masters/${key}`;
              fetchPromises.push(dispatch(fetchMasterCategoryData(key, endpoint, false)).catch(() => { }));
            }
          }

          // Always fetch data for the active tab to display current records
          if (activeConfig) {
            fetchPromises.push(dispatch(fetchMasterCategoryData(activeTabKey, activeConfig.apiEndpoint, false)).catch(() => { }));
          }

          if (fetchPromises.length > 0) {
            await Promise.all(fetchPromises);
          }
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
  const allTalukas = masterState.talukas || [];
  const allVillages = masterState.villages || [];
  const allPcs = masterState.pcs || [];
  const allAcs = masterState.acs || [];
  const allWards = masterState.wards || [];
  const allReligions = masterState.religions || [];

  // Cascading Filter Dropdown Options
  const filteredDistrictsOptions = React.useMemo(() => {
    if (!filterStateId) return allDistricts;
    return allDistricts.filter((d: any) => d.stateId === filterStateId);
  }, [allDistricts, filterStateId]);

  const filteredTalukasOptions = React.useMemo(() => {
    let list = allTalukas;
    if (filterDistrictId) {
      list = list.filter((t: any) => t.districtId === filterDistrictId);
    } else if (filterStateId) {
      list = list.filter((t: any) => t.stateId === filterStateId);
    }
    return list;
  }, [allTalukas, filterDistrictId, filterStateId]);

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

  const filteredWardsOptions = React.useMemo(() => {
    let list = allWards;
    if (filterAcId) {
      list = list.filter((w: any) => w.acId === filterAcId);
    }
    return list;
  }, [allWards, filterAcId]);

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

    if (activeTabKey === 'talukas') {
      if (filterStateId) {
        list = list.filter((item: any) => item.stateId === filterStateId);
      }
      if (filterDistrictId) {
        list = list.filter((item: any) => item.districtId === filterDistrictId);
      }
    }

    if (activeTabKey === 'villages') {
      if (filterStateId) {
        list = list.filter((item: any) => item.stateId === filterStateId);
      }
      if (filterDistrictId) {
        list = list.filter((item: any) => item.districtId === filterDistrictId);
      }
      if (filterTalukaId) {
        list = list.filter((item: any) => item.talukaId === filterTalukaId);
      }
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

    if (activeTabKey === 'wards') {
      if (filterStateId) {
        const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === filterStateId).map((p: any) => p.id));
        const stateAcIds = new Set(allAcs.filter((a: any) => a.stateId === filterStateId || statePcIds.has(a.pcId)).map((a: any) => a.id));
        list = list.filter((item: any) => stateAcIds.has(item.acId));
      }
      if (filterPcId) {
        const pcAcIds = new Set(allAcs.filter((a: any) => a.pcId === filterPcId).map((a: any) => a.id));
        list = list.filter((item: any) => pcAcIds.has(item.acId));
      }
      if (filterAcId) {
        list = list.filter((item: any) => item.acId === filterAcId);
      }
    }

    if (activeTabKey === 'booths') {
      if (filterWardId) {
        list = list.filter((item: any) => item.wardId === filterWardId);
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
    setFilterTalukaId('');
    setFilterAcId('');
    setFilterWardId('');
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

    // Auto-resolve any missing parent hierarchy fields (State, District, PC, AC) from existing references
    const prefilledData = { ...item };
    if (item.acId && (!prefilledData.stateId || !prefilledData.districtId || !prefilledData.pcId)) {
      const parentAc = allAcs.find((a: any) => a.id === item.acId);
      if (parentAc) {
        if (!prefilledData.stateId && parentAc.stateId) prefilledData.stateId = parentAc.stateId;
        if (!prefilledData.districtId && parentAc.districtId) prefilledData.districtId = parentAc.districtId;
        if (!prefilledData.pcId && parentAc.pcId) prefilledData.pcId = parentAc.pcId;
      }
    }
    if (item.wardId && !prefilledData.acId) {
      const parentWard = allWards.find((w: any) => w.id === item.wardId);
      if (parentWard?.acId) prefilledData.acId = parentWard.acId;
    }
    if (item.talukaId && (!prefilledData.districtId || !prefilledData.stateId)) {
      const parentTaluka = allTalukas.find((t: any) => t.id === item.talukaId);
      if (parentTaluka) {
        if (!prefilledData.districtId && parentTaluka.districtId) prefilledData.districtId = parentTaluka.districtId;
        if (!prefilledData.stateId && parentTaluka.stateId) prefilledData.stateId = parentTaluka.stateId;
      }
    }
    if (item.districtId && !prefilledData.stateId) {
      const parentDistrict = allDistricts.find((d: any) => d.id === item.districtId);
      if (parentDistrict?.stateId) prefilledData.stateId = parentDistrict.stateId;
    }
    if (item.pcId && !prefilledData.stateId) {
      const parentPc = allPcs.find((p: any) => p.id === item.pcId);
      if (parentPc?.stateId) prefilledData.stateId = parentPc.stateId;
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
      const updated = {
        ...prev,
        [fieldKey]: value,
      };

      // When State changes, clear downstream selections if they no longer match
      if (fieldKey === 'stateId') {
        if (updated.districtId) {
          const d = allDistricts.find((x: any) => x.id === updated.districtId);
          if (d && value && d.stateId !== value) updated.districtId = '';
        }
        if (updated.pcId) {
          const p = allPcs.find((x: any) => x.id === updated.pcId);
          if (p && value && p.stateId !== value) updated.pcId = '';
        }
      }

      // If PC is selected, auto-fill State
      if (fieldKey === 'pcId' && value) {
        const selectedPc = allPcs.find((p: any) => p.id === value);
        if (selectedPc?.stateId) {
          updated.stateId = selectedPc.stateId;
        }
      }

      // If District is selected, auto-fill State
      if (fieldKey === 'districtId' && value) {
        const selectedDistrict = allDistricts.find((d: any) => d.id === value);
        if (selectedDistrict?.stateId) {
          updated.stateId = selectedDistrict.stateId;
        }
      }

      // If AC is selected, auto-fill PC, District, and State
      if (fieldKey === 'acId' && value) {
        const selectedAc = allAcs.find((a: any) => a.id === value);
        if (selectedAc) {
          if (selectedAc.stateId && !updated.stateId) updated.stateId = selectedAc.stateId;
          if (selectedAc.districtId && !updated.districtId) updated.districtId = selectedAc.districtId;
          if (selectedAc.pcId && !updated.pcId) updated.pcId = selectedAc.pcId;
        }
      }

      // If Ward is selected in Booth form, auto-fill AC and parent hierarchy
      if (fieldKey === 'wardId' && value) {
        const selectedWard = allWards.find((w: any) => w.id === value);
        if (selectedWard?.acId) {
          updated.acId = selectedWard.acId;
          const selectedAc = allAcs.find((a: any) => a.id === selectedWard.acId);
          if (selectedAc) {
            if (selectedAc.stateId && !updated.stateId) updated.stateId = selectedAc.stateId;
            if (selectedAc.districtId && !updated.districtId) updated.districtId = selectedAc.districtId;
            if (selectedAc.pcId && !updated.pcId) updated.pcId = selectedAc.pcId;
          }
        }
      }

      // If Taluka is selected, auto-fill District and State
      if (fieldKey === 'talukaId' && value) {
        const selectedTaluka = allTalukas.find((t: any) => t.id === value);
        if (selectedTaluka) {
          if (selectedTaluka.districtId && !updated.districtId) updated.districtId = selectedTaluka.districtId;
          if (selectedTaluka.stateId && !updated.stateId) updated.stateId = selectedTaluka.stateId;
        }
      }

      return updated;
    });
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

  if (['districts', 'talukas', 'villages', 'pcs', 'acs', 'wards', 'booths'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterStateId',
      label: 'State',
      type: 'select',
      value: filterStateId,
      onChange: (val) => {
        setFilterStateId(val);
        setFilterPcId('');
        setFilterDistrictId('');
        setFilterTalukaId('');
        setFilterAcId('');
        setFilterWardId('');
      },
      options: [{ label: 'All States', value: '' }, ...allStates.map((s: any) => ({ label: s.name, value: s.id }))],
      isPrimary: true,
    });
  }

  if (['acs', 'wards', 'booths'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterPcId',
      label: 'Parliamentary (PC)',
      type: 'select',
      value: filterPcId,
      onChange: (val) => {
        setFilterPcId(val);
        setFilterAcId('');
        setFilterWardId('');
      },
      options: [{ label: 'All PCs', value: '' }, ...filteredPcsOptions.map((p: any) => ({ label: p.name, value: p.id }))],
      isPrimary: false,
    });
  }

  if (['talukas', 'villages'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterDistrictId',
      label: 'District',
      type: 'select',
      value: filterDistrictId,
      onChange: (val) => {
        setFilterDistrictId(val);
        setFilterTalukaId('');
      },
      options: [{ label: 'All Districts', value: '' }, ...filteredDistrictsOptions.map((d: any) => ({ label: d.name, value: d.id }))],
      isPrimary: true,
    });
  }

  if (activeTabKey === 'villages') {
    filterFields.push({
      key: 'filterTalukaId',
      label: 'Taluka',
      type: 'select',
      value: filterTalukaId,
      onChange: setFilterTalukaId,
      options: [{ label: 'All Talukas', value: '' }, ...filteredTalukasOptions.map((t: any) => ({ label: t.name, value: t.id }))],
      isPrimary: true,
    });
  }

  if (['wards', 'booths'].includes(activeTabKey)) {
    filterFields.push({
      key: 'filterAcId',
      label: 'Assembly (AC)',
      type: 'select',
      value: filterAcId,
      onChange: (val) => {
        setFilterAcId(val);
        setFilterWardId('');
      },
      options: [{ label: 'All ACs', value: '' }, ...filteredAcsOptions.map((a: any) => ({ label: a.name, value: a.id }))],
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
        maxWidth="2xl"
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
              } else if (f.name === 'talukaId') {
                const targetDistrict = formData.districtId;
                const targetState = formData.stateId;
                let stateTalukas = allTalukas;
                if (targetDistrict) {
                  stateTalukas = stateTalukas.filter((t: any) => t.districtId === targetDistrict);
                } else if (targetState) {
                  stateTalukas = stateTalukas.filter((t: any) => t.stateId === targetState);
                }
                options = stateTalukas.map((t: any) => ({ label: t.name, value: t.id }));
              } else if (f.name === 'villageId') {
                const targetTaluka = formData.talukaId;
                const targetDistrict = formData.districtId;
                const targetState = formData.stateId;
                let availableVillages = allVillages;
                if (targetTaluka) {
                  availableVillages = availableVillages.filter((v: any) => v.talukaId === targetTaluka);
                } else if (targetDistrict) {
                  availableVillages = availableVillages.filter((v: any) => v.districtId === targetDistrict);
                } else if (targetState) {
                  availableVillages = availableVillages.filter((v: any) => v.stateId === targetState);
                }
                options = availableVillages.map((v: any) => ({ label: v.name, value: v.id }));
              } else if (f.name === 'pcId') {
                const targetState = formData.stateId;
                const statePcs = targetState
                  ? allPcs.filter((p: any) => p.stateId === targetState)
                  : allPcs;
                options = statePcs.map((p: any) => ({ label: p.name, value: p.id }));
              } else if (f.name === 'acId') {
                const targetPc = formData.pcId;
                const targetDistrict = formData.districtId;
                const targetState = formData.stateId;
                let pcAcs = allAcs;
                if (targetPc) {
                  pcAcs = pcAcs.filter((a: any) => a.pcId === targetPc);
                } else if (targetDistrict) {
                  pcAcs = pcAcs.filter((a: any) => a.districtId === targetDistrict);
                } else if (targetState) {
                  const statePcIds = new Set(allPcs.filter((p: any) => p.stateId === targetState).map((p: any) => p.id));
                  pcAcs = pcAcs.filter((a: any) => a.stateId === targetState || statePcIds.has(a.pcId));
                }
                options = pcAcs.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id }));
              } else if (f.name === 'wardId') {
                const targetAc = formData.acId;
                const acWards = targetAc
                  ? allWards.filter((w: any) => w.acId === targetAc)
                  : allWards;
                options = acWards.map((w: any) => ({ label: `${w.wardNumber ? `#${w.wardNumber} - ` : ''}${w.name}`, value: w.id }));
              } else if (f.name === 'religionId') {
                options = allReligions.map((r: any) => ({ label: r.name, value: r.id }));
              } else if (f.name === 'parentCasteId') {
                options = (masterState.castes || [])
                  .filter((c: any) => c.id !== editingItem?.id)
                  .map((c: any) => ({ label: c.name, value: c.id }));
              }

              const isFullWidth = f.fullWidth || f.type === 'textarea' || f.type === 'file' || f.name === 'locationBuilding';
              const rows = f.rows || (f.type === 'textarea' ? 2 : undefined) || (f.name === 'locationBuilding' ? 2 : undefined);

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
