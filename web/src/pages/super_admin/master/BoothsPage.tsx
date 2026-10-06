import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ImportModal } from '@/components/common/ImportModal';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { exportToExcel, parseExcelFile } from '@/utils/exportImport';
import { startBulkImportJob } from '@/redux/actions/importJobs';
import { Vote } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { BoothFormModal } from '@/components/common/master/form';

export const BoothsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    wards: wardsData = [],
    acs: acsData = [],
    pcs: pcsData = [],
    districts: districtsData = [],
    states: statesData = [],
  } = useMasterData(['wards', 'acs', 'pcs', 'districts', 'states']);
  const boothsData = useAppSelector((state) => state.master.booths || []);
  const boothsPagination = useAppSelector((state) => state.master.pagination?.booths);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [pcId, setPcId] = useState('');
  const [acId, setAcId] = useState('');
  const [wardId, setWardId] = useState('');

  // Modal States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Debounced backend fetch for booths data with filter and pagination parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (stateId) params.stateId = stateId;
    if (districtId) params.districtId = districtId;
    if (pcId) params.pcId = pcId;
    if (acId) params.acId = acId;
    if (wardId) params.wardId = wardId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('booths', '/masters/booths', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, page, limit, search, stateId, districtId, pcId, acId, wardId]);

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

  const filteredWardOptions = useMemo(() => {
    const raw = acId ? wardsData.filter((w: any) => String(w.acId) === String(acId)) : wardsData;
    return raw.map((w: any) => ({ label: `${w.wardNumber ? `${w.wardNumber} - ` : ''}${w.name}`, value: w.id }));
  }, [wardsData, acId]);

  // Client-side filtering
  const filteredBooths = useMemo(() => {
    return boothsData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (pcId && String(item.pcId) !== String(pcId)) return false;
      if (acId && String(item.acId) !== String(acId)) return false;
      if (wardId && String(item.wardId) !== String(wardId)) return false;
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
  }, [boothsData, search, stateId, districtId, pcId, acId, wardId]);

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
    setWardId('');
    setPage(1);
  };

  const filterFields: FilterField[] = [
    {
      key: 'stateId',
      label: 'State',
      category: 'Geography Hierarchy',
      type: 'select',
      value: stateId,
      onChange: (val) => {
        setStateId(val);
        setDistrictId('');
        setPcId('');
        setAcId('');
        setWardId('');
        setPage(1);
      },
      options: stateOptions,
      placeholder: 'All States',
    },
    {
      key: 'districtId',
      label: 'District',
      category: 'Geography Hierarchy',
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
      label: 'Parliamentary Constituency (PC)',
      category: 'Constituencies',
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
      label: 'Assembly Constituency (AC)',
      category: 'Constituencies',
      type: 'select',
      value: acId,
      onChange: (val) => {
        setAcId(val);
        setWardId('');
        setPage(1);
      },
      options: filteredAcOptions,
      placeholder: 'All ACs',
    },
    {
      key: 'wardId',
      label: 'Ward / Prabhag',
      category: 'Local Area',
      type: 'select',
      value: wardId,
      onChange: (val) => {
        setWardId(val);
        setPage(1);
      },
      options: filteredWardOptions,
      placeholder: 'All Wards',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'boothNumber', header: 'Booth No.', sortable: true },
    { key: 'name', header: 'Polling Station Name', sortable: true },
    { key: 'acName', header: 'Assembly (AC)', sortable: true, render: (row) => row.acName || '-' },
    { key: 'wardName', header: 'Ward / Prabhag', sortable: true, render: (row) => row.wardName || '-' },
    { key: 'totalVoters', header: 'Total Voters', sortable: true, render: (row) => row.totalVoters ?? 0 },
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

  const handleImport = async (file: File, parsedRecords?: Record<string, any>[], context?: Record<string, any>) => {
    try {
      const records = parsedRecords && parsedRecords.length > 0 ? parsedRecords : await parseExcelFile(file);
      if (!records.length) {
        toast.error('The uploaded file contains no data');
        return;
      }
      await dispatch(
        startBulkImportJob(
          'booths',
          records,
          () => {
            const params: Record<string, any> = { page, limit };
            if (stateId) params.stateId = stateId;
            if (districtId) params.districtId = districtId;
            if (pcId) params.pcId = pcId;
            if (acId) params.acId = acId;
            if (wardId) params.wardId = wardId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('booths', '/masters/booths', false, params));
          },
          context || { stateId, districtId, pcId, acId, wardId }
        )
      );
      toast.success('Bulk import job queued for Booths!');
      setIsImportModalOpen(false);
    } catch {
      toast.error('Failed to queue import');
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
        addLabel="Add Booth"
        icon={<Vote className="w-6 h-6 text-indigo-500" />}
        isSyncing={isSyncing}
        title="Polling Booths"
        onSyncClick={handleSync}
        onAddClick={handleOpenAdd}
        onExportClick={handleExport}
        onImportClick={() => setIsImportModalOpen(true)}
        subtitle="Manage individual polling booth locations under Wards and Assembly Constituencies."
      />

      <FilterBar
        searchPlaceholder="Search Booth No, Polling Station Name, AC, Ward..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          loading={loading}
          data={boothsData}
          showHeader={false}
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
      </div>

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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Booths"
        categoryKey="booths"
        sampleParams={{ stateId, districtId, pcId, acId, wardId }}
      />
    </div>
  );
};

export default BoothsPage;
