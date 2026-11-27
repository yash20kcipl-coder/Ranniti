import toast from 'react-hot-toast';
import { Landmark } from 'lucide-react';
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
import { AcFormModal } from '@/components/common/master/form';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const AcsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useMasterData hook
  const acsData = useAppSelector((state) => state.master.acs || []);
  const { pcs: pcsData = [], districts: districtsData = [], states: statesData = [] } = useMasterData(['pcs', 'districts', 'states']);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (District & PC inline filters)
  const [pcId, setPcId] = useState('');
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Debounced backend fetch for acs data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (districtId) params.districtId = districtId;
    if (pcId) params.pcId = pcId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('acs', '/masters/acs', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, search, districtId, pcId]);

  const districtOptions = useMemo(() => {
    return districtsData.map((d: any) => ({ label: d.name, value: d.id }));
  }, [districtsData]);

  const pcOptions = useMemo(() => {
    return pcsData.map((p: any) => ({ label: p.name, value: p.id }));
  }, [pcsData]);

  // Client-side filtering
  const filteredAcs = useMemo(() => {
    return acsData.filter((item: any) => {
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
  }, [acsData, search, districtId, pcId]);

  const handleResetFilters = () => {
    setSearch('');
    setDistrictId('');
    setPcId('');
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
        onChange: setDistrictId,
        options: [{ label: 'All Districts', value: '' }, ...districtOptions],
        isPrimary: true,
      },
      {
        key: 'pcId',
        label: 'Parliamentary (PC)',
        type: 'select',
        value: pcId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: setPcId,
        options: [{ label: 'All PCs', value: '' }, ...pcOptions],
        isPrimary: true,
      },
    ],
    [districtId, pcId, districtOptions, pcOptions]
  );

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'acNumber',
      header: 'AC No.',
      sortable: true,
      render: (row) => <span className="font-mono font-medium text-[9.5px] text-slate-700 dark:text-slate-300">#{row.acNumber || '-'}</span>,
    },
    {
      key: 'name',
      header: 'Assembly Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.stateName || '-'}</span> },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.districtName || '-'}</span> },
    { key: 'pcName', header: 'PC', sortable: true, render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.pcName || '-'}</span> },
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
        addLabel="Add AC"
        isSyncing={isSyncing}
        onSyncClick={handleSync}
        onAddClick={handleOpenAdd}
        onExportClick={handleExport}
        title="Assembly Constituencies (AC)"
        icon={<Landmark className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage Vidhan Sabha assembly constituencies."
      />

      <DataTable
        columns={columns}
        data={filteredAcs}
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
            searchPlaceholder="Search AC No, Assembly Name, District, PC..."
            onSearchChange={setSearch}
          />
        }
        actions={(row) => (
          <TableActions
            onEdit={() => handleOpenEdit(row)}
            onDelete={() => handleOpenDelete(row)}
          />
        )}
      />

      <AcFormModal
        pcs={pcsData}
        onSave={handleSave}
        states={statesData}
        isOpen={isModalOpen}
        districts={districtsData}
        editingItem={editingItem}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        title="Delete AC"
        confirmText="Delete"
        loading={isDeleting}
        confirmVariant="danger"
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
      />
    </div>
  );
};

export default AcsPage;
