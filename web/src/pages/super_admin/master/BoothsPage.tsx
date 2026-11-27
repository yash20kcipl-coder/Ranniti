import toast from 'react-hot-toast';
import { Vote } from 'lucide-react';
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
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { BoothFormModal } from '@/components/common/master/form';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const BoothsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const boothsData = useAppSelector((state) => state.master.booths || []);
  const boothsPagination = useAppSelector((state) => state.master.pagination?.booths);
  const { wards: wardsData = [], acs: acsData = [], pcs: pcsData = [], districts: districtsData = [], states: statesData = [], }
    = useMasterData(['wards', 'acs', 'pcs', 'districts', 'states']);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [acId, setAcId] = useState('');
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Debounced backend fetch for booths data with filter and pagination parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (districtId) params.districtId = districtId;
    if (acId) params.acId = acId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('booths', '/masters/booths', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, page, limit, search, districtId, acId]);

  const districtOptions = useMemo(() => {
    return districtsData.map((d: any) => ({ label: d.name, value: d.id }));
  }, [districtsData]);

  const filteredAcOptions = useMemo(() => {
    const raw = districtId
      ? acsData.filter((a: any) => String(a.districtId) === String(districtId))
      : acsData;
    return raw.map((a: any) => ({ label: `${a.acNumber ? `#${a.acNumber} - ` : ''}${a.name}`, value: a.id }));
  }, [acsData, districtId]);

  // Client-side filtering
  const filteredBooths = useMemo(() => {
    return boothsData.filter((item: any) => {
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (acId && String(item.acId) !== String(acId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchNumber = String(item.boothNumber || '').toLowerCase().includes(query);
        const matchAc = item.acName?.toLowerCase().includes(query);
        const matchWard = item.wardName?.toLowerCase().includes(query);
        if (!matchName && !matchNumber && !matchAc && !matchWard) return false;
      }
      return true;
    });
  }, [boothsData, search, districtId, acId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDistrictId('');
    setAcId('');
    setPage(1);
  };

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'districtId',
        label: 'District',
        type: 'select',
        value: districtId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => {
          setDistrictId(val);
          setAcId('');
          setPage(1);
        },
        options: [{ label: 'All Districts', value: '' }, ...districtOptions],
        isPrimary: true,
      },
      {
        key: 'acId',
        label: 'Assembly (AC)',
        type: 'select',
        value: acId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => {
          setAcId(val);
          setPage(1);
        },
        options: [{ label: 'All ACs', value: '' }, ...filteredAcOptions],
        isPrimary: true,
      },
    ],
    [districtId, acId, districtOptions, filteredAcOptions]
  );

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'boothNumber',
      header: 'Booth No.',
      sortable: true,
      render: (row) => <span className="font-mono font-medium text-[9.5px] text-slate-700 dark:text-slate-300">#{row.boothNumber || '-'}</span>,
    },
    {
      key: 'name',
      header: 'Polling Station Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    { key: 'locationBuilding', header: 'Location / Address', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.locationBuilding || '-'}</span> },
    { key: 'acName', header: 'Assembly (AC)', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.acName || '-'}</span> },
    { key: 'wardName', header: 'Ward / Prabhag', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.wardName || '-'}</span> },
    {
      key: 'totalVoters',
      header: 'Total Voters',
      sortable: true,
      render: (row) => <span className="font-mono font-medium text-[9.5px] text-slate-700 dark:text-slate-300">{(row.totalVoters ?? 0).toLocaleString()}</span>,
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

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('booths', '/masters/booths', editingItem.id, data)
        );
        toast.success('Polling booth updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('booths', '/masters/booths', data)
        );
        toast.success('Polling booth created successfully!');
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
        deleteSuperAdminMasterCategoryItem('booths', '/masters/booths', itemToDelete.id)
      );
      toast.success('Polling booth deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredBooths.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredBooths, 'Booths_List', ['boothNumber', 'name', 'acName', 'wardName', 'totalVoters']);
    toast.success('Booths exported successfully');
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
    <div className="space-y-4">
      <PageHeader
        title="Polling Booths"
        addLabel="Add Booth"
        isSyncing={isSyncing}
        onSyncClick={handleSync}
        onAddClick={handleOpenAdd}
        onExportClick={handleExport}
        icon={<Vote className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage individual polling booth locations under Wards and Assembly Constituencies."
      />

      <DataTable
        columns={columns}
        loading={loading}
        data={boothsData}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            filters={filterFields}
            showDrawerButton={false}
            showResetButton={false}
            searchValue={search}
            onSearchChange={handleSearchChange}
            onReset={handleResetFilters}
            searchPlaceholder="Search Booth No, Polling Station Name, AC, Ward..."
          />
        }
        serverPagination={
          boothsPagination
            ? {
              page: boothsPagination.page,
              limit: boothsPagination.limit,
              total: boothsPagination.total,
              totalPages: boothsPagination.totalPages,
              onPageChange: (newPage) => setPage(newPage),
              onLimitChange: (newLimit) => {
                setLimit(newLimit);
                setPage(1);
              },
            }
            : undefined
        }
        actions={(row) => (
          <TableActions
            onEdit={() => handleOpenEdit(row)}
            onDelete={() => handleOpenDelete(row)}
          />
        )}
      />

      <BoothFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Booth"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

    </div>
  );
};

export default BoothsPage;
