import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ImportModal } from '@/components/common/ImportModal';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { exportToExcel, parseExcelFile } from '@/utils/exportImport';
import { startBulkImportJob } from '@/redux/actions/importJobs';
import { Globe } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { PcFormModal } from '@/components/common/master/form';

export const PcsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const { states: statesData = [] } = useMasterData(['states']);
  const pcsData = useAppSelector((state) => state.master.pcs || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (1 filter -> inline)
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for pcs data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (stateId) params.stateId = stateId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('pcs', '/masters/pcs', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, stateId]);

  const stateOptions = useMemo(() => statesData.map((s: any) => ({ label: s.name, value: s.id })), [statesData]);

  // Client-side filtering
  const filteredPcs = useMemo(() => {
    return pcsData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchNumber = String(item.pcNumber || '').toLowerCase().includes(query);
        const matchState = item.stateName?.toLowerCase().includes(query);
        if (!matchName && !matchNumber && !matchState) return false;
      }
      return true;
    });
  }, [pcsData, search, stateId]);

  const handleResetFilters = () => {
    setSearch('');
    setStateId('');
  };

  const filterFields: FilterField[] = [
    {
      key: 'stateId',
      label: 'State',
      type: 'select',
      value: stateId,
      onChange: setStateId,
      options: stateOptions,
      placeholder: 'All States',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'name', header: 'Constituency Name', sortable: true },
    { key: 'pcNumber', header: 'PC No.', sortable: true },
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

  const handleSave = async (data: { name: string; pcNumber: number | string; stateId: string }) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('pcs', '/masters/pcs', editingItem.id, data)
        );
        toast.success('PC updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('pcs', '/masters/pcs', data)
        );
        toast.success('PC created successfully!');
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
        deleteSuperAdminMasterCategoryItem('pcs', '/masters/pcs', itemToDelete.id)
      );
      toast.success('PC deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredPcs.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredPcs, 'PCs_List', ['name', 'pcNumber', 'stateName']);
    toast.success('PCs exported successfully');
  };

  const handleImport = async (file: File, parsedRecords?: Record<string, any>[], context?: Record<string, any>) => {
    try {
      const records = parsedRecords && parsedRecords.length > 0 ? parsedRecords : await parseExcelFile(file);
      if (!records.length) {
        toast.error('The uploaded file contains no data');
        return;
      }
      await dispatch(
        startBulkImportJob(
          'pcs',
          records,
          () => {
            const params: Record<string, string> = {};
            if (stateId) params.stateId = stateId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('pcs', '/masters/pcs', false, params));
          },
          context || { stateId }
        )
      );
      toast.success('Bulk import job queued for PCs!');
      setIsImportModalOpen(false);
    } catch {
      toast.error('Failed to queue import');
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
        title="Parliamentary Constituencies (PC)"
        icon={<Globe className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage Lok Sabha parliamentary constituencies."
        onAddClick={handleOpenAdd}
        addLabel="Add PC"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search PC Name, PC No, State..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPcs}
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

      <PcFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        states={statesData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete PC"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import PCs"
        categoryKey="pcs"
        sampleParams={{ stateId }}
      />
    </div>
  );
};

export default PcsPage;
