import toast from 'react-hot-toast';
import { Globe } from 'lucide-react';
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
import { PcFormModal } from '@/components/common/master/form';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

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
      defaultValue: '',
      excludeFromCount: true,
      onChange: setStateId,
      options: [{ label: 'All States', value: '' }, ...stateOptions],
      isPrimary: true,
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'pcNumber',
      header: 'PC No.',
      sortable: true,
      render: (row) => <span className="font-mono font-medium text-[9.5px] text-slate-700 dark:text-slate-300">#{row.pcNumber || '-'}</span>,
    },
    {
      key: 'name',
      header: 'Constituency Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.stateName || '-'}</span> },
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
    <div className="space-y-4">
      <PageHeader
        addLabel="Add PC"
        isSyncing={isSyncing}
        onSyncClick={handleSync}
        onAddClick={handleOpenAdd}
        onExportClick={handleExport}
        title="Parliamentary Constituencies (PC)"
        icon={<Globe className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage Lok Sabha parliamentary constituencies."
      />

      <DataTable
        columns={columns}
        data={filteredPcs}
        loading={loading}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchPlaceholder="Search PC Name, PC No, State..."
            searchValue={search}
            showDrawerButton={false}
            showResetButton={false}
            onSearchChange={setSearch}
            filters={filterFields}
            onReset={handleResetFilters}
          />
        }
        actions={(row) => (
          <TableActions
            onEdit={() => handleOpenEdit(row)}
            onDelete={() => handleOpenDelete(row)}
          />
        )}
      />

      <PcFormModal
        states={statesData}
        onSave={handleSave}
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        title="Delete PC"
        confirmText="Delete"
        loading={isDeleting}
        confirmVariant="danger"
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
      />
    </div>
  );
};

export default PcsPage;
