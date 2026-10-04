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
import { Landmark } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import { AcFormModal } from '@/components/common/master/form';

export const AcsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const { pcs: pcsData = [], districts: districtsData = [], states: statesData = [] } = useMasterData(['pcs', 'districts', 'states']);
  const acsData = useAppSelector((state) => state.master.acs || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (3 filters -> inline)
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [pcId, setPcId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for acs data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (stateId) params.stateId = stateId;
    if (districtId) params.districtId = districtId;
    if (pcId) params.pcId = pcId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('acs', '/masters/acs', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, stateId, districtId, pcId]);

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

  // Client-side filtering
  const filteredAcs = useMemo(() => {
    return acsData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (pcId && String(item.pcId) !== String(pcId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchNumber = String(item.acNumber || '').toLowerCase().includes(query);
        const matchDistrict = item.districtName?.toLowerCase().includes(query);
        const matchPc = item.pcName?.toLowerCase().includes(query);
        if (!matchName && !matchNumber && !matchDistrict && !matchPc) return false;
      }
      return true;
    });
  }, [acsData, search, stateId, districtId, pcId]);

  const handleResetFilters = () => {
    setSearch('');
    setStateId('');
    setDistrictId('');
    setPcId('');
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
      },
      options: stateOptions,
      placeholder: 'All States',
    },
    {
      key: 'districtId',
      label: 'District',
      type: 'select',
      value: districtId,
      onChange: setDistrictId,
      options: filteredDistrictOptions,
      placeholder: 'All Districts',
    },
    {
      key: 'pcId',
      label: 'Parliamentary Constituency (PC)',
      type: 'select',
      value: pcId,
      onChange: setPcId,
      options: filteredPcOptions,
      placeholder: 'All PCs',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'acNumber', header: 'AC No.', sortable: true },
    { key: 'name', header: 'Assembly Name', sortable: true },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => row.stateName || '-' },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => row.districtName || '-' },
    { key: 'pcName', header: 'PC', sortable: true, render: (row) => row.pcName || '-' },
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
          updateSuperAdminMasterCategoryItem('acs', '/masters/acs', editingItem.id, data)
        );
        toast.success('AC updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('acs', '/masters/acs', data)
        );
        toast.success('AC created successfully!');
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
        deleteSuperAdminMasterCategoryItem('acs', '/masters/acs', itemToDelete.id)
      );
      toast.success('AC deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredAcs.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredAcs, 'ACs_List', ['acNumber', 'name', 'stateName', 'districtName', 'pcName']);
    toast.success('ACs exported successfully');
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
          'acs',
          records,
          () => {
            const params: Record<string, string> = {};
            if (stateId) params.stateId = stateId;
            if (districtId) params.districtId = districtId;
            if (pcId) params.pcId = pcId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('acs', '/masters/acs', false, params));
          },
          context || { stateId, districtId, pcId }
        )
      );
      toast.success('Bulk import job queued for ACs!');
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Assembly Constituencies (AC)"
        icon={<Landmark className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage Vidhan Sabha assembly constituencies."
        onAddClick={handleOpenAdd}
        addLabel="Add AC"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search AC No, Assembly Name, District, PC..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredAcs}
          loading={loading}
          showHeader={false}
          actions={(row) => (
            <TableActions
              onEdit={() => handleOpenEdit(row)}
              onDelete={() => handleOpenDelete(row)}
            />
          )}
        />
      </div>

      <AcFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        pcs={pcsData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete AC"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import ACs"
        categoryKey="acs"
        sampleParams={{ stateId, districtId, pcId }}
      />
    </div>
  );
};

export default AcsPage;
