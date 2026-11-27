import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Home } from 'lucide-react';
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
import { VillageFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantVillagesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const villagesData = useAppSelector((state) => state.master.villages || []);
  const villagesPagination = useAppSelector((state) => state.master.pagination?.villages);
  const { talukas: talukasData = [], districts: districtsData = [], states: statesData = [] } = useTenantMasterData([
    'talukas',
    'districts',
    'states',
  ]);

  const [loading, setLoading] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [talukaId, setTalukaId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.VILLAGES;

  // Debounced backend fetch for villages data with filter and pagination parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (districtId) params.districtId = districtId;
    if (talukaId) params.talukaId = talukaId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchTenantMasterCategoryData('villages', endpoint, false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, page, limit, search, districtId, talukaId]);

  // Auto-select district if single district available in tenant scope
  useDebouncedEffect(() => {
    if (districtsData?.length === 1 && !districtId) {
      setDistrictId(String(districtsData[0].id));
    }
  }, 50, [districtsData, districtId]);

  const filteredTalukaOptions = useMemo(() => {
    if (!districtId) return talukasData;
    return talukasData.filter((t: any) => String(t.districtId) === String(districtId));
  }, [talukasData, districtId]);

  // Auto-select taluka if single taluka available
  useDebouncedEffect(() => {
    if (filteredTalukaOptions?.length === 1 && !talukaId) {
      setTalukaId(String(filteredTalukaOptions[0].id));
    }
  }, 50, [filteredTalukaOptions, talukaId]);

  const handleResetFilters = () => {
    setSearch('');
    setDistrictId(districtsData?.length === 1 ? String(districtsData[0].id) : '');
    setTalukaId(talukasData?.length === 1 ? String(talukasData[0].id) : '');
    setPage(1);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('villages', endpoint, editingItem.id, data));
        toast.success('Village updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('villages', endpoint, data));
        toast.success('Village created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Village');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('villages', endpoint, itemToDelete.id));
      toast.success('Village deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Village');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!villagesData.length) {
      toast.error('No villages available to export');
      return;
    }
    const exportRows = villagesData.map((v: any) => ({
      'Village Name': v.name,
      'Taluka': v.talukaName || '-',
      'District': v.districtName || '-',
      'State': v.stateName || '-',
    }));
    exportToExcel(exportRows, 'Villages_List');
    toast.success('Villages exported successfully!');
  };

  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [];

    if (districtsData.length > 1) {
      fields.push({
        key: 'districtId',
        label: 'District',
        type: 'select',
        value: districtId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => {
          setDistrictId(val);
          setTalukaId('');
          setPage(1);
        },
        options: [{ label: 'All Districts', value: '' }, ...districtsData.map((d: any) => ({ label: d.name, value: d.id }))],
        isPrimary: true,
      });
    }

    if (filteredTalukaOptions.length > 1) {
      fields.push({
        key: 'talukaId',
        label: 'Taluka',
        type: 'select',
        value: talukaId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => {
          setTalukaId(val);
          setPage(1);
        },
        options: [{ label: 'All Talukas', value: '' }, ...filteredTalukaOptions.map((t: any) => ({ label: t.name, value: t.id }))],
        isPrimary: true,
      });
    }

    return fields;
  }, [districtsData, filteredTalukaOptions, districtId, talukaId]);

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Village Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'talukaName',
      header: 'Taluka',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.talukaName || '-'}</span>,
    },
    {
      key: 'districtName',
      header: 'District',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.districtName || '-'}</span>,
    },
    {
      key: 'stateName',
      header: 'State',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.stateName || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Villages (Gaon)"
        subtitle="Manage revenue villages and rural settlements within campaign jurisdiction."
        icon={<Home size={22} />}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Village"
        onExportClick={handleExport}
      />

      <DataTable
        columns={columns}
        data={villagesData}
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
            searchPlaceholder="Search villages, talukas, districts..."
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        }
        serverPagination={
          villagesPagination
            ? {
              page: villagesPagination.page,
              limit: villagesPagination.limit,
              total: villagesPagination.total,
              totalPages: villagesPagination.totalPages,
              onPageChange: (newPage: number) => setPage(newPage),
              onLimitChange: (newLimit: number) => {
                setLimit(newLimit);
                setPage(1);
              },
            }
            : undefined
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

      <VillageFormModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        talukas={talukasData}
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
        title="Delete Village"
        description="Are you sure you want to delete this Village? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantVillagesPage;
