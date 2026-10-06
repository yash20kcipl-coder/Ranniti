import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ImportModal } from '@/components/common/ImportModal';
import { FilterBar } from '@/components/common/FilterBar';
import { exportToExcel, parseExcelFile } from '@/utils/exportImport';
import { startBulkImportJob } from '@/redux/actions/importJobs';
import { HeartHandshake } from 'lucide-react';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { ReligionFormModal } from '@/components/common/master/form';

export const ReligionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const religionsData = useAppSelector((state) => state.master.religions || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for religions data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('religions', '/masters/religions', false, params))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, 250, [dispatch, search]);

  // Client-side filtering
  const filteredReligions = useMemo(() => {
    if (!search.trim()) return religionsData;
    const query = search.toLowerCase();
    return religionsData.filter((item: any) =>
      item.name?.toLowerCase().includes(query)
    );
  }, [religionsData, search]);

  const handleResetFilters = () => {
    setSearch('');
  };

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'name', header: 'Religion Name', sortable: true },
  ];

  // Actions
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

  const handleSave = async (data: { name: string }) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('religions', '/masters/religions', editingItem.id, data)
        );
        toast.success('Religion updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('religions', '/masters/religions', data)
        );
        toast.success('Religion created successfully!');
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
        deleteSuperAdminMasterCategoryItem('religions', '/masters/religions', itemToDelete.id)
      );
      toast.success('Religion deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredReligions.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredReligions, 'Religions_List', ['name']);
    toast.success('Religions exported successfully');
  };

  const handleImport = async (file: File, parsedRecords?: Record<string, any>[]) => {
    try {
      const records = parsedRecords && parsedRecords.length > 0 ? parsedRecords : await parseExcelFile(file);
      if (!records.length) {
        toast.error('The uploaded file contains no data');
        return;
      }
      await dispatch(
        startBulkImportJob('religions', records, () => {
          const params: Record<string, string> = {};
          if (search.trim()) params.search = search.trim();
          dispatch(fetchSuperAdminMasterCategoryData('religions', '/masters/religions', false, params));
        })
      );
      toast.success('Bulk import job queued for Religions!');
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
        title="Religions"
        icon={<HeartHandshake className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage religious demographic classification categories."
        onAddClick={handleOpenAdd}
        addLabel="Add Religion"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Religions..."
        searchValue={search}
        onSearchChange={setSearch}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredReligions}
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

      <ReligionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Religion"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Religions"
        categoryKey="religions"
      />
    </div>
  );
};

export default ReligionsPage;
