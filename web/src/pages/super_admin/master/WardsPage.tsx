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
import { ImportModal } from '@/components/common/ImportModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WardFormModal } from '@/components/common/master/form';
import { startBulkImportFileJob } from '@/redux/actions/importJobs';
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
  const [pcId, setPcId] = useState('');
  const [acId, setAcId] = useState('');
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Debounced backend fetch for wards data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (stateId) params.stateId = stateId;
    if (districtId) params.districtId = districtId;
    if (pcId) params.pcId = pcId;
    if (acId) params.acId = acId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('wards', '/masters/wards', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, page, limit, search, stateId, districtId, pcId, acId]);

  // Options with cascading dependencies
  const stateOptions = useMemo(() => statesData.map((s: any) => ({ label: s.name, value: s.id })), [statesData]);

  const filteredDistrictOptions = useMemo(() => {
    const raw = stateId ? districtsData.filter((d: any) => String(d.stateId) === String(stateId)) : districtsData;
    return raw.map((d: any) => ({ label: d.name, value: d.id }));
  }, [districtsData, stateId]);

  const filteredPcOptions = useMemo(() => {
    const raw = stateId ? pcsData.filter((p: any) => String(p.stateId) === String(stateId)) : pcsData;
    return raw.map((p: any) => ({ label: p.name, value: p.id }));
  }, [pcsData, stateId]);

  const filteredAcOptions = useMemo(() => {
    const raw = districtId
      ? acsData.filter((a: any) => String(a.districtId) === String(districtId))
      : pcId
        ? acsData.filter((a: any) => String(a.pcId) === String(pcId))
        : stateId
          ? acsData.filter((a: any) => String(a.stateId) === String(stateId))
          : acsData;
    return raw.map((a: any) => ({ label: a.name, value: a.id }));
  }, [acsData, districtId, pcId, stateId]);

  // Client-side filtering
  const filteredWards = useMemo(() => {
    return wardsData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (pcId && String(item.pcId) !== String(pcId)) return false;
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
  }, [wardsData, search, stateId, districtId, pcId, acId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStateId('');
    setDistrictId('');
    setPcId('');
    setAcId('');
    setPage(1);
  };

  const filterFields: FilterField[] = [
    {
      key: 'stateId',
      label: 'State',
      type: 'select',
      value: stateId,
      onChange: (val) => {
        setStateId(val);
        setDistrictId('');
        setPcId('');
        setAcId('');
        setPage(1);
      },
      options: stateOptions,
      placeholder: 'All States',
    },
    {
      key: 'districtId',
      label: 'District',
      type: 'select',
      value: districtId,
      onChange: (val) => {
        setDistrictId(val);
        setAcId('');
        setPage(1);
      },
      options: filteredDistrictOptions,
      placeholder: 'All Districts',
    },
    {
      key: 'pcId',
      label: 'PC',
      type: 'select',
      value: pcId,
      onChange: (val) => {
        setPcId(val);
        setAcId('');
        setPage(1);
      },
      options: filteredPcOptions,
      placeholder: 'All PCs',
    },
    {
      key: 'acId',
      label: 'AC',
      type: 'select',
      value: acId,
      onChange: (val) => {
        setAcId(val);
        setPage(1);
      },
      options: filteredAcOptions,
      placeholder: 'All ACs',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'wardNumber', header: 'Ward No.', sortable: true },
    { key: 'name', header: 'Ward / Prabhag Name', sortable: true },
    { key: 'acName', header: 'Assembly Constituency (AC)', sortable: true, render: (row) => row.acName || '-' },
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

  const handleImport = async (file: File, _?: any, context?: Record<string, any>) => {
    try {
      await dispatch(
        startBulkImportFileJob(
          'wards',
          file,
          () => {
            const params: Record<string, any> = { page, limit };
            if (stateId) params.stateId = stateId;
            if (districtId) params.districtId = districtId;
            if (pcId) params.pcId = pcId;
            if (acId) params.acId = acId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('wards', '/masters/wards', false, params));
          },
          context || { stateId, districtId, pcId, acId }
        )
      );
      toast.success('Bulk import job started for Wards!');
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
        title="Wards (Prabhags)"
        icon={<Layers className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage electoral wards / prabhags under Assembly Constituencies."
        onAddClick={handleOpenAdd}
        addLabel="Add Ward"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Ward No, Prabhag Name, AC..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={wardsData}
          loading={loading}
          showHeader={false}
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
      </div>

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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Wards"
        categoryKey="wards"
        sampleParams={{ stateId, districtId, pcId, acId }}
      />
    </div>
  );
};

export default WardsPage;
