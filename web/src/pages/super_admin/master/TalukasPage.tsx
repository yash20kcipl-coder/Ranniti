import { Map } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import React, { useState, useMemo } from 'react';
import { exportToExcel } from '@/utils/exportImport';
import { useMasterData } from '@/hooks/useMasterData';
import { PageHeader } from '@/components/common/PageHeader';
import { ImportModal } from '@/components/common/ImportModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TalukaFormModal } from '@/components/common/master/form';
import { startBulkImportFileJob } from '@/redux/actions/importJobs';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const TalukasPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const { districts: districtsData = [], states: statesData = [] } = useMasterData(['districts', 'states']);
  const talukasData = useAppSelector((state) => state.master.talukas || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (2 filters -> inline)
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for talukas data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (stateId) params.stateId = stateId;
    if (districtId) params.districtId = districtId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('talukas', '/masters/talukas', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, stateId, districtId]);

  // Options with cascading dependencies
  const stateOptions = useMemo(() => statesData.map((s: any) => ({ label: s.name, value: s.id })), [statesData]);

  const filteredDistrictOptions = useMemo(() => {
    const raw = stateId ? districtsData.filter((d: any) => String(d.stateId) === String(stateId)) : districtsData;
    return raw.map((d: any) => ({ label: d.name, value: d.id }));
  }, [districtsData, stateId]);

  // Client-side filtering
  const filteredTalukas = useMemo(() => {
    return talukasData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchDistrict = item.districtName?.toLowerCase().includes(query);
        const matchState = item.stateName?.toLowerCase().includes(query);
        if (!matchName && !matchDistrict && !matchState) return false;
      }
      return true;
    });
  }, [talukasData, search, stateId, districtId]);

  const handleResetFilters = () => {
    setSearch('');
    setStateId('');
    setDistrictId('');
  };

  const filterFields: FilterField[] = [
    {
      key: 'stateId',
      label: 'State',
      type: 'select',
      value: stateId,
      onChange: (val) => {
        setStateId(val);
        setDistrictId('');
      },
      options: stateOptions,
      placeholder: 'All States',
    },
    {
      key: 'districtId',
      label: 'District',
      type: 'select',
      value: districtId,
      onChange: setDistrictId,
      options: filteredDistrictOptions,
      placeholder: 'All Districts',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'name', header: 'Taluka Name', sortable: true },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => row.districtName || '-' },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => row.stateName || '-' },
  ];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleSave = async (data: { name: string; stateId: string; districtId: string }) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('talukas', '/masters/talukas', editingItem.id, data)
        );
        toast.success('Taluka updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('talukas', '/masters/talukas', data)
        );
        toast.success('Taluka created successfully!');
      }
      setIsModalOpen(false);
    } catch {
      // Handled in thunk
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(
        deleteSuperAdminMasterCategoryItem('talukas', '/masters/talukas', itemToDelete.id)
      );
      toast.success('Taluka deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredTalukas.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredTalukas, 'Talukas_List', ['name', 'districtName', 'stateName']);
    toast.success('Talukas exported successfully');
  };

  const handleImport = async (file: File, _?: any, context?: Record<string, any>) => {
    try {
      await dispatch(
        startBulkImportFileJob(
          'talukas',
          file,
          () => {
            const params: Record<string, string> = {};
            if (stateId) params.stateId = stateId;
            if (districtId) params.districtId = districtId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('talukas', '/masters/talukas', false, params));
          },
          context || { stateId, districtId }
        )
      );
      toast.success('Bulk import job started for Talukas!');
      setIsImportModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start import');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await dispatch(syncAllSuperAdminMasters());
      toast.success('Synchronized successfully!');
    } catch {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talukas (Tehsils)"
        icon={<Map className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage administrative taluka / tehsil divisions within districts."
        onAddClick={handleOpenAdd}
        addLabel="Add Taluka"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Taluka Name, District, State..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTalukas}
          loading={loading}
          showHeader={false}
          actions={(row) => (
            <TableActions
              onEdit={() => handleOpenEdit(row)}
              onDelete={() => handleOpenDelete(row)}
            />
          )}
        />
      </div>

      <TalukaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Taluka"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Talukas"
        categoryKey="talukas"
        sampleParams={{ stateId, districtId }}
      />
    </div>
  );
};

export default TalukasPage;
