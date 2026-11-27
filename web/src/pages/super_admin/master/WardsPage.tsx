import toast from 'react-hot-toast';
import { Layers } from 'lucide-react';
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
import { WardFormModal } from '@/components/common/master/form';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const WardsPage: React.FC = () => {

  // Load master reference options using useMasterData hook
  const wardsData = useAppSelector((state) => state.master.wards || []);
  const wardsPagination = useAppSelector((state) => state.master.pagination?.wards);
  const { acs: acsData = [], pcs: pcsData = [], districts: districtsData = [], states: statesData = [] }
    = useMasterData(['acs', 'pcs', 'districts', 'states']);

  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [districtId, setDistrictId] = useState('');
  const [acId, setAcId] = useState('');
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');

  // Modal States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Debounced backend fetch for wards data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (districtId) params.districtId = districtId;
    if (acId) params.acId = acId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('wards', '/masters/wards', false, params)).finally(() => {
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
  const filteredWards = useMemo(() => {
    return wardsData.filter((item: any) => {
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (acId && String(item.acId) !== String(acId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchNumber = String(item.wardNumber || '').toLowerCase().includes(query);
        const matchAc = item.acName?.toLowerCase().includes(query);
        if (!matchName && !matchNumber && !matchAc) return false;
      }
      return true;
    });
  }, [wardsData, search, districtId, acId]);

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

  const filterFields: FilterField[] = [
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
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'wardNumber',
      header: 'Ward No.',
      sortable: true,
      render: (row) => <span className="font-mono font-medium text-[9.5px] text-slate-700 dark:text-slate-300">#{row.wardNumber || '-'}</span>,
    },
    {
      key: 'name',
      header: 'Ward / Prabhag Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    { key: 'acName', header: 'Assembly Constituency (AC)', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.acName || '-'}</span> },
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
          updateSuperAdminMasterCategoryItem('wards', '/masters/wards', editingItem.id, data)
        );
        toast.success('Ward updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('wards', '/masters/wards', data)
        );
        toast.success('Ward created successfully!');
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
        deleteSuperAdminMasterCategoryItem('wards', '/masters/wards', itemToDelete.id)
      );
      toast.success('Ward deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredWards.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredWards, 'Wards_List', ['wardNumber', 'name', 'acName']);
    toast.success('Wards exported successfully');
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
        title="Wards (Prabhags)"
        icon={<Layers className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage electoral wards / prabhags under Assembly Constituencies."
        onAddClick={handleOpenAdd}
        addLabel="Add Ward"
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <DataTable
        columns={columns}
        data={wardsData}
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
            searchPlaceholder="Search Ward No, Prabhag Name, AC..."
            onSearchChange={handleSearchChange}
          />
        }
        serverPagination={
          wardsPagination
            ? {
              page: wardsPagination.page,
              limit: wardsPagination.limit,
              total: wardsPagination.total,
              totalPages: wardsPagination.totalPages,
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

      <WardFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        pcs={pcsData}
        acs={acsData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Ward"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

    </div>
  );
};

export default WardsPage;
