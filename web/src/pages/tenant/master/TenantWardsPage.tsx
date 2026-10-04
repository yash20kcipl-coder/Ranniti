import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Layers } from 'lucide-react';
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
import { WardFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantWardsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useTenantMasterData hook
  const {
    acs: acsData = [],
    pcs: pcsData = [],
    districts: districtsData = [],
    states: statesData = [],
  } = useTenantMasterData(['acs', 'pcs', 'districts', 'states']);
  const wardsData = useAppSelector((state) => state.master.wards || []);
  const paginationMeta = useAppSelector((state) => state.master.pagination?.wards);

  const [loading, setLoading] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterPcId, setFilterPcId] = useState('');
  const [filterAcId, setFilterAcId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.WARDS;

  // Debounced backend fetch for wards data with filter parameters
  useDebouncedEffect(
    () => {
      let active = true;
      setLoading(true);

      const params: Record<string, any> = { page, limit };
      if (filterPcId) params.pcId = filterPcId;
      if (filterAcId) params.acId = filterAcId;
      if (search.trim()) params.search = search.trim();

      dispatch(fetchTenantMasterCategoryData('wards', endpoint, false, params)).finally(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
      };
    },
    200,
    [dispatch, page, limit, search, filterPcId, filterAcId]
  );

  const filteredAcsOptions = useMemo(() => {
    if (!filterPcId) return acsData;
    return acsData.filter((a: any) => String(a.pcId) === String(filterPcId));
  }, [acsData, filterPcId]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterPcId('');
    setFilterAcId('');
    setPage(1);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('wards', endpoint, editingItem.id, data));
        toast.success('Ward updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('wards', endpoint, data));
        toast.success('Ward created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Ward');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('wards', endpoint, itemToDelete.id));
      toast.success('Ward deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Ward');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    if (!wardsData || wardsData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = wardsData.map((item: any) => ({
      'Ward No.': item.wardNumber || '',
      'Ward / Prabhag Name': item.name || '',
      'Assembly Constituency (AC)': item.acName || '',
    }));
    exportToExcel(cleanData, 'Wards_Export');
    toast.success('Excel file exported successfully!');
  };

  const columns: Column<any>[] = [
    { key: 'wardNumber', header: 'Ward No.', sortable: true },
    { key: 'name', header: 'Ward / Prabhag Name', sortable: true },
    { key: 'acName', header: 'Assembly Constituency (AC)', sortable: true, render: (row) => row.acName || '-' },
  ];

  const filterFields: FilterField[] = [
    {
      key: 'filterPcId',
      label: 'Parliamentary (PC)',
      type: 'select',
      value: filterPcId,
      onChange: (val) => {
        setFilterPcId(val);
        setFilterAcId('');
        setPage(1);
      },
      options: [{ label: 'All PCs', value: '' }, ...pcsData.map((p: any) => ({ label: p.name, value: p.id }))],
    },
    {
      key: 'filterAcId',
      label: 'Assembly (AC)',
      type: 'select',
      value: filterAcId,
      onChange: (val) => {
        setFilterAcId(val);
        setPage(1);
      },
      options: [
        { label: 'All ACs', value: '' },
        ...filteredAcsOptions.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id })),
      ],
      isPrimary: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wards (Prabhags)"
        subtitle="Manage electoral wards and prabhags under Assembly Constituencies."
        icon={<Layers size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {paginationMeta?.total ?? wardsData.length} {(paginationMeta?.total ?? wardsData.length) === 1 ? 'Record' : 'Records'}
          </span>
        }
        onExportClick={handleExportExcel}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Ward"
      />

      <FilterBar
        searchPlaceholder="Search wards..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl dark:bg-slate-900/60 dark:border dark:border-slate-800 dark:p-1">
        <DataTable
          columns={columns}
          data={wardsData}
          loading={loading}
          showHeader={false}
          serverPagination={{
            page: paginationMeta?.page || page,
            limit: paginationMeta?.limit || limit,
            total: paginationMeta?.total || wardsData.length,
            totalPages: paginationMeta?.totalPages || 1,
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
          }}
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
      </div>

      <WardFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        pcs={pcsData}
        acs={acsData}
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
        title="Delete Ward"
        description="Are you sure you want to delete this Ward? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantWardsPage;
