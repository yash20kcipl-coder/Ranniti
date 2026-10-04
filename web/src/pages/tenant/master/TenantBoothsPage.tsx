import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Vote } from 'lucide-react';
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
import { BoothFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantBoothsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useTenantMasterData hook
  const {
    wards: wardsData = [],
    acs: acsData = [],
    pcs: pcsData = [],
    districts: districtsData = [],
    states: statesData = [],
  } = useTenantMasterData(['wards', 'acs', 'pcs', 'districts', 'states']);
  const boothsData = useAppSelector((state) => state.master.booths || []);
  const paginationMeta = useAppSelector((state) => state.master.pagination?.booths);

  const [loading, setLoading] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterPcId, setFilterPcId] = useState('');
  const [filterAcId, setFilterAcId] = useState('');
  const [filterWardId, setFilterWardId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.BOOTHS;

  // Debounced backend fetch for booths data with filter parameters
  useDebouncedEffect(
    () => {
      let active = true;
      setLoading(true);

      const params: Record<string, any> = { page, limit };
      if (filterPcId) params.pcId = filterPcId;
      if (filterAcId) params.acId = filterAcId;
      if (filterWardId) params.wardId = filterWardId;
      if (search.trim()) params.search = search.trim();

      dispatch(fetchTenantMasterCategoryData('booths', endpoint, false, params)).finally(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
      };
    },
    200,
    [dispatch, page, limit, search, filterPcId, filterAcId, filterWardId]
  );

  const filteredAcsOptions = useMemo(() => {
    if (!filterPcId) return acsData;
    return acsData.filter((a: any) => String(a.pcId) === String(filterPcId));
  }, [acsData, filterPcId]);

  const filteredWardsOptions = useMemo(() => {
    if (!filterAcId) return wardsData;
    return wardsData.filter((w: any) => String(w.acId) === String(filterAcId));
  }, [wardsData, filterAcId]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterPcId('');
    setFilterAcId('');
    setFilterWardId('');
    setPage(1);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('booths', endpoint, editingItem.id, data));
        toast.success('Polling Booth updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('booths', endpoint, data));
        toast.success('Polling Booth created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Polling Booth');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('booths', endpoint, itemToDelete.id));
      toast.success('Polling Booth deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Polling Booth');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    if (!boothsData || boothsData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = boothsData.map((item: any) => ({
      'Booth No.': item.boothNumber || '',
      'Polling Station Name': item.name || '',
      'Assembly (AC)': item.acName || '',
      'Ward / Prabhag': item.wardName || '',
      'Total Voters': item.totalVoters ?? 0,
    }));
    exportToExcel(cleanData, 'Polling_Booths_Export');
    toast.success('Excel file exported successfully!');
  };

  const columns: Column<any>[] = [
    { key: 'boothNumber', header: 'Booth No.', sortable: true },
    { key: 'name', header: 'Polling Station Name', sortable: true },
    { key: 'acName', header: 'Assembly (AC)', sortable: true, render: (row) => row.acName || '-' },
    { key: 'wardName', header: 'Ward / Prabhag', sortable: true, render: (row) => row.wardName || '-' },
    { key: 'totalVoters', header: 'Total Voters', sortable: true, render: (row) => row.totalVoters ?? 0 },
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
        setFilterWardId('');
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
        setFilterWardId('');
        setPage(1);
      },
      options: [
        { label: 'All ACs', value: '' },
        ...filteredAcsOptions.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id })),
      ],
    },
    {
      key: 'filterWardId',
      label: 'Ward / Prabhag',
      type: 'select',
      value: filterWardId,
      onChange: (val) => {
        setFilterWardId(val);
        setPage(1);
      },
      options: [
        { label: 'All Wards', value: '' },
        ...filteredWardsOptions.map((w: any) => ({ label: `${w.wardNumber ? `#${w.wardNumber} - ` : ''}${w.name}`, value: w.id })),
      ],
      isPrimary: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Polling Booths"
        subtitle="Manage individual polling booth locations under Wards and Assembly Constituencies."
        icon={<Vote size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {paginationMeta?.total ?? boothsData.length} {(paginationMeta?.total ?? boothsData.length) === 1 ? 'Record' : 'Records'}
          </span>
        }
        onExportClick={handleExportExcel}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Booth"
      />

      <FilterBar
        searchPlaceholder="Search polling booths..."
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
          data={boothsData}
          loading={loading}
          showHeader={false}
          serverPagination={{
            page: paginationMeta?.page || page,
            limit: paginationMeta?.limit || limit,
            total: paginationMeta?.total || boothsData.length,
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

      <BoothFormModal
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
        wards={wardsData}
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
        title="Delete Polling Booth"
        description="Are you sure you want to delete this Polling Booth? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantBoothsPage;
