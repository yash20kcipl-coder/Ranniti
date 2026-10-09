import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
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
import { CasteFormModal } from '@/components/common/master/form';
import { startBulkImportFileJob } from '@/redux/actions/importJobs';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const CastesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const { religions: religionsData = [] } = useMasterData(['religions']);
  const castesData = useAppSelector((state) => state.master.castes || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (2 filters -> inline)
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [religionId, setReligionId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for castes data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (religionId) params.religionId = religionId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('castes', '/masters/castes', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, religionId]);

  const religionOptions = useMemo(() => religionsData.map((r: any) => ({ label: r.name, value: r.id })), [religionsData]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    castesData.forEach((c: any) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).map((cat) => ({ label: cat, value: cat }));
  }, [castesData]);

  // Client-side filtering
  const filteredCastes = useMemo(() => {
    return castesData.filter((item: any) => {
      if (categoryFilter && String(item.category || '') !== String(categoryFilter)) return false;
      if (religionId && String(item.religionId) !== String(religionId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchCategory = item.category?.toLowerCase().includes(query);
        const matchReligion = item.religionName?.toLowerCase().includes(query);
        const matchParent = item.parentCasteName?.toLowerCase().includes(query);
        if (!matchName && !matchCategory && !matchReligion && !matchParent) return false;
      }
      return true;
    });
  }, [castesData, search, categoryFilter, religionId]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setReligionId('');
  };

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: categoryOptions,
      placeholder: 'All Categories',
    },
    {
      key: 'religionId',
      label: 'Religion',
      type: 'select',
      value: religionId,
      onChange: setReligionId,
      options: religionOptions,
      placeholder: 'All Religions',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'name', header: 'Caste / Subcaste Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'religionName', header: 'Religion', sortable: true, render: (row) => row.religionName || '-' },
    { key: 'parentCasteName', header: 'Parent Caste', sortable: true, render: (row) => row.parentCasteName || '-' },
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

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('castes', '/masters/castes', editingItem.id, data)
        );
        toast.success('Caste updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('castes', '/masters/castes', data)
        );
        toast.success('Caste created successfully!');
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
        deleteSuperAdminMasterCategoryItem('castes', '/masters/castes', itemToDelete.id)
      );
      toast.success('Caste deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredCastes.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredCastes, 'Castes_List', ['name', 'category', 'religionName', 'parentCasteName']);
    toast.success('Castes exported successfully');
  };

  const handleImport = async (file: File, _?: any, context?: Record<string, any>) => {
    try {
      await dispatch(
        startBulkImportFileJob(
          'castes',
          file,
          () => {
            const params: Record<string, string> = {};
            if (religionId) params.religionId = religionId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('castes', '/masters/castes', false, params));
          },
          context || { religionId }
        )
      );
      toast.success('Bulk import job started for Castes!');
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
        title="Castes & Subcastes"
        icon={<Users className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage caste categories and social classifications."
        onAddClick={handleOpenAdd}
        addLabel="Add Caste"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Caste, Category, Religion, Parent Caste..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCastes}
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

      <CasteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        religions={religionsData}
        castes={castesData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Caste"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Castes"
        categoryKey="castes"
        sampleParams={{ religionId }}
      />
    </div>
  );
};

export default CastesPage;
