import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FilterBar } from '@/components/common/FilterBar';
import { exportToExcel } from '@/utils/exportImport';
import {
  fetchTenantMasterCategoryData,
  createTenantMasterCategoryItem,
  updateTenantMasterCategoryItem,
  deleteTenantMasterCategoryItem,
} from '@/redux/actions/masterTenant';
import { ProfessionCategoryFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantProfessionCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const categoriesData = useAppSelector((state) => state.master.professionCategories || []);

  const [loading, setLoading] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.PROFESSION_CATEGORIES;

  // Debounced backend fetch
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    dispatch(fetchTenantMasterCategoryData('professionCategories', endpoint, false))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, 250, [dispatch]);

  // Client-side filtering
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categoriesData;
    const query = search.toLowerCase();
    return categoriesData.filter((cat: any) => {
      const matchName = cat.name?.toLowerCase().includes(query);
      const matchDesc = cat.description?.toLowerCase().includes(query);
      return matchName || matchDesc;
    });
  }, [categoriesData, search]);

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('professionCategories', endpoint, editingItem.id, data));
        toast.success('Profession Category updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('professionCategories', endpoint, data));
        toast.success('Profession Category created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Profession Category');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('professionCategories', endpoint, itemToDelete.id));
      toast.success('Profession Category deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Profession Category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredCategories.length) {
      toast.error('No categories available to export');
      return;
    }
    const exportRows = filteredCategories.map((c: any) => ({
      'Category Name': c.name,
      'Professions Count': c.professionCount ?? 0,
    }));
    exportToExcel(exportRows, 'Profession_Categories_List');
    toast.success('Profession Categories exported successfully!');
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'professionCount',
      header: 'Total Professions',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.professionCount ?? 0}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profession Categories"
        subtitle="Manage occupational sectors, career types, and demographic industries within campaign jurisdiction."
        icon={<Briefcase size={22} />}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Category"
        onExportClick={handleExport}
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
            searchPlaceholder="Search profession categories, descriptions..."
            searchValue={search}
            showDrawerButton={false}
            showResetButton={false}
            onSearchChange={setSearch}
            onReset={() => setSearch('')}
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

      <ProfessionCategoryFormModal
        isOpen={isModalOpen}
        editingItem={editingItem}
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
        title="Delete Profession Category"
        description="Are you sure you want to delete this Profession Category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantProfessionCategoriesPage;
