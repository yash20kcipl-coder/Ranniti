import toast from 'react-hot-toast';
import { Award } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { exportToExcel } from '@/utils/exportImport';
import { useMasterData } from '@/hooks/useMasterData';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ProfessionFormModal } from '@/components/common/master/form';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const ProfessionsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load category options
  const { professionCategories: categoriesData = [] } = useMasterData(['professionCategories']);
  const professionsData = useAppSelector((state) => state.master.professions || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced fetch
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (categoryId) params.categoryId = categoryId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('professions', '/masters/professions', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, categoryId]);

  const categoryOptions = useMemo(
    () => categoriesData.map((c: any) => ({ label: c.name, value: c.id })),
    [categoriesData]
  );

  // Client-side filtering
  const filteredProfessions = useMemo(() => {
    return professionsData.filter((item: any) => {
      if (categoryId && String(item.categoryId) !== String(categoryId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchCat = item.categoryName?.toLowerCase().includes(query);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [professionsData, search, categoryId]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
  };

  const filterFields: FilterField[] = [
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      value: categoryId,
      defaultValue: '',
      excludeFromCount: true,
      options: [{ label: 'All Categories', value: '' }, ...categoryOptions],
      onChange: (val) => setCategoryId(val as string),
      isPrimary: true,
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Specific Profession Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'categoryName',
      header: 'Profession Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {row.categoryName || '-'}
        </span>
      ),
    },
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

  const handleSave = async (data: { categoryId: string; name: string }) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('professions', '/masters/professions', editingItem.id, data)
        );
        toast.success('Profession updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('professions', '/masters/professions', data)
        );
        toast.success('Profession created successfully!');
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
        deleteSuperAdminMasterCategoryItem('professions', '/masters/professions', itemToDelete.id)
      );
      toast.success('Profession deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredProfessions.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredProfessions, 'Professions_List', ['name', 'categoryName']);
    toast.success('Professions exported successfully');
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
        title="Specific Professions"
        subtitle="Manage detailed occupations and classifications under profession categories"
        icon={<Award className="w-6 h-6 text-indigo-500" />}
        onAddClick={handleOpenAdd}
        addLabel="Add Profession"
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <DataTable
        columns={columns}
        data={filteredProfessions}
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
            searchPlaceholder="Search profession name..."
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

      <ProfessionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        categories={categoriesData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Specific Profession"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ProfessionsPage;
