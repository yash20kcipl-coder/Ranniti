import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { exportToExcel } from '@/utils/exportImport';
import { FilterBar } from '@/components/common/FilterBar';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ProfessionCategoryFormModal } from '@/components/common/master/form';

export const ProfessionCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const categoriesData = useAppSelector((state) => state.master.professionCategories || []);

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

  // Debounced backend fetch
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('professionCategories', '/masters/profession-categories', false, params))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, 250, [dispatch, search]);

  // Client-side filtering
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categoriesData;
    const query = search.toLowerCase();
    return categoriesData.filter((item: any) =>
      item.name?.toLowerCase().includes(query)
    );
  }, [categoriesData, search]);

  const handleResetFilters = () => {
    setSearch('');
  };

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
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
          updateSuperAdminMasterCategoryItem('professionCategories', '/masters/profession-categories', editingItem.id, data)
        );
        toast.success('Profession category updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('professionCategories', '/masters/profession-categories', data)
        );
        toast.success('Profession category created successfully!');
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
        deleteSuperAdminMasterCategoryItem('professionCategories', '/masters/profession-categories', itemToDelete.id)
      );
      toast.success('Profession category deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredCategories.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredCategories, 'Profession_Categories_List', ['name']);
    toast.success('Profession categories exported successfully');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await dispatch(syncAllSuperAdminMasters());
      toast.success('All master records synced successfully across tenant databases');
    } catch (err: any) {
      toast.error(err.message || 'Failed to synchronize master records');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profession Categories"
        subtitle="Manage broad occupational and demographic categories for voter profiling"
        icon={<Briefcase className="w-6 h-6 text-indigo-500" />}
        onAddClick={handleOpenAdd}
        addLabel="Add Category"
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchValue={search}
            showDrawerButton={false}
            showResetButton={false}
            onSearchChange={setSearch}
            searchPlaceholder="Search category name..."
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

      <ProfessionCategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Profession Category"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ProfessionCategoriesPage;
