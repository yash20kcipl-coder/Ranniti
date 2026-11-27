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
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TalukaFormModal } from '@/components/common/master/form';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const TalukasPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const { districts: districtsData = [], states: statesData = [] } = useMasterData(['districts', 'states']);
  const talukasData = useAppSelector((state) => state.master.talukas || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced backend fetch for talukas data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (districtId) params.districtId = districtId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('talukas', '/masters/talukas', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, districtId]);

  const districtOptions = useMemo(() => districtsData.map((d: any) => ({ label: d.name, value: d.id })), [districtsData]);

  // Client-side filtering
  const filteredTalukas = useMemo(() => {
    return talukasData.filter((item: any) => {
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
  }, [talukasData, search, districtId]);

  const handleResetFilters = () => {
    setSearch('');
    setDistrictId('');
  };

  const filterFields: FilterField[] = [
    {
      key: 'districtId',
      label: 'District',
      type: 'select',
      value: districtId,
      defaultValue: '',
      excludeFromCount: true,
      onChange: setDistrictId,
      options: [{ label: 'All Districts', value: '' }, ...districtOptions],
      isPrimary: true,
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Taluka Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.districtName || '-'}</span> },
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
        title="Talukas"
        icon={<Map className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage administrative taluka / tehsil divisions within districts."
        onAddClick={handleOpenAdd}
        addLabel="Add Taluka"
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <DataTable
        columns={columns}
        data={filteredTalukas}
        loading={loading}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            filters={filterFields}
            showDrawerButton={false}
            showResetButton={false}
            searchValue={search}
            onReset={handleResetFilters}
            searchPlaceholder="Search Taluka Name, District, State..."
            onSearchChange={setSearch}
          />
        }
        actions={(row) => (
          <TableActions
            onEdit={() => handleOpenEdit(row)}
            onDelete={() => handleOpenDelete(row)}
          />
        )}
      />

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

    </div>
  );
};

export default TalukasPage;
