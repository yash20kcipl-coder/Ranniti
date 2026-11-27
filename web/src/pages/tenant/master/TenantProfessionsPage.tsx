import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Award } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { exportToExcel } from '@/utils/exportImport';
import { useTenantMasterData } from '@/hooks/useTenantMasterData';
import {
  fetchTenantMasterCategoryData,
  createTenantMasterCategoryItem,
  updateTenantMasterCategoryItem,
  deleteTenantMasterCategoryItem,
} from '@/redux/actions/masterTenant';
import { ProfessionFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantProfessionsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load category options
  const { professionCategories: categoriesData = [] } = useTenantMasterData(['professionCategories']);
  const professionsData = useAppSelector((state) => state.master.professions || []);

  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.PROFESSIONS;

  // Debounced backend fetch
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (categoryId) params.categoryId = categoryId;

    dispatch(fetchTenantMasterCategoryData('professions', endpoint, false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, categoryId]);

  const categoryOptions = useMemo(
    () => categoriesData.map((c: any) => ({ label: c.name, value: c.id })),
    [categoriesData]
  );

  // Client-side filtering
  const filteredProfessions = useMemo(() => {
    return professionsData.filter((prof: any) => {
      if (categoryId && String(prof.categoryId) !== String(categoryId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = prof.name?.toLowerCase().includes(query);
        const matchCat = prof.categoryName?.toLowerCase().includes(query);
        const matchDesc = prof.description?.toLowerCase().includes(query);
        return matchName || matchCat || matchDesc;
      }
      return true;
    });
  }, [professionsData, categoryId, search]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('professions', endpoint, editingItem.id, data));
        toast.success('Profession updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('professions', endpoint, data));
        toast.success('Profession created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Profession');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('professions', endpoint, itemToDelete.id));
      toast.success('Profession deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Profession');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredProfessions.length) {
      toast.error('No professions available to export');
      return;
    }
    const exportRows = filteredProfessions.map((p: any) => ({
      'Profession Name': p.name,
      'Category': p.categoryName || '-',
    }));
    exportToExcel(exportRows, 'Professions_List');
    toast.success('Professions exported successfully!');
  };

  const filterFields: FilterField[] = [
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      value: categoryId,
      defaultValue: '',
      excludeFromCount: true,
      onChange: (val) => setCategoryId(val),
      options: [{ label: 'All Categories', value: '' }, ...categoryOptions],
      isPrimary: true,
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Profession Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'categoryName',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {row.categoryName || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Specific Professions"
        subtitle="Manage job titles, vocational specializations, and career designations within campaign jurisdiction."
        icon={<Award size={22} />}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Profession"
        onExportClick={handleExport}
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
            searchPlaceholder="Search professions, categories, descriptions..."
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
            onEdit={() => {
              setEditingItem(row);
              setIsModalOpen(true);
            }}
            onDelete={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
          />
        )}
      />

      <ProfessionFormModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        categories={categoriesData}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Profession"
        description="Are you sure you want to delete this Profession? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantProfessionsPage;
