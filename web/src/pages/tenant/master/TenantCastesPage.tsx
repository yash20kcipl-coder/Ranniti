import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
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
import { CasteFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantCastesPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useTenantMasterData hook
  const { religions: religionsData = [] } = useTenantMasterData(['religions']);
  const castesData = useAppSelector((state) => state.master.castes || []);

  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [religionId, setReligionId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.CASTES;

  // Debounced backend fetch for castes data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (religionId) params.religionId = religionId;

    dispatch(fetchTenantMasterCategoryData('castes', endpoint, false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, religionId]);

  const religionOptions = useMemo(
    () => religionsData.map((r: any) => ({ label: r.name, value: r.id })),
    [religionsData]
  );

  const categoryOptions = useMemo(() => {
    const defaultCategories = ['General', 'OBC', 'SC', 'ST', 'Other'];
    return defaultCategories.map((cat) => ({ label: cat, value: cat }));
  }, []);

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
        return matchName || matchCategory || matchReligion || matchParent;
      }
      return true;
    });
  }, [castesData, search, categoryFilter, religionId]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setReligionId('');
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('castes', endpoint, editingItem.id, data));
        toast.success('Caste updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('castes', endpoint, data));
        toast.success('Caste created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Caste');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('castes', endpoint, itemToDelete.id));
      toast.success('Caste deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Caste');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredCastes.length) {
      toast.error('No castes available to export');
      return;
    }
    const exportRows = filteredCastes.map((c: any) => ({
      'Caste Name': c.name,
      'Category': c.category || '-',
      'Religion': c.religionName || '-',
      'Parent Caste': c.parentCasteName || '-',
    }));
    exportToExcel(exportRows, 'Castes_List');
    toast.success('Castes exported successfully!');
  };

  const filterFields: FilterField[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      value: categoryFilter,
      defaultValue: '',
      excludeFromCount: true,
      onChange: (val) => setCategoryFilter(val),
      options: [{ label: 'All Categories', value: '' }, ...categoryOptions],
      isPrimary: true,
    },
    {
      key: 'religionId',
      label: 'Religion',
      type: 'select',
      value: religionId,
      defaultValue: '',
      excludeFromCount: true,
      onChange: (val) => setReligionId(val),
      options: [{ label: 'All Religions', value: '' }, ...religionOptions],
      isPrimary: true,
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Caste / Subcaste Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.category || '-'}
        </span>
      ),
    },
    {
      key: 'religionName',
      header: 'Religion',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.religionName || '-'}</span>,
    },
    {
      key: 'parentCasteName',
      header: 'Parent Caste',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.parentCasteName || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Castes & Subcastes"
        subtitle="Manage social demographics, caste reservations, and subcaste lineages within campaign jurisdiction."
        icon={<Users size={22} />}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Caste"
        onExportClick={handleExport}
      />

      <DataTable
        columns={columns}
        data={filteredCastes}
        loading={loading}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchPlaceholder="Search castes, categories, religions..."
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

      <CasteFormModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        religions={religionsData}
        castes={castesData}
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
        title="Delete Caste"
        description="Are you sure you want to delete this Caste? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantCastesPage;
