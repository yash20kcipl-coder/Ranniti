import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
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
import { VillageFormModal } from '@/components/common/master/form';
import { startBulkImportFileJob } from '@/redux/actions/importJobs';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const VillagesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const villagesData = useAppSelector((state) => state.master.villages || []);
  const villagesPagination = useAppSelector((state) => state.master.pagination?.villages);
  const { talukas: talukasData = [], districts: districtsData = [], states: statesData = [] } = useMasterData(['talukas', 'districts', 'states']);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [talukaId, setTalukaId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for villages data with filter and pagination parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, any> = { page, limit };
    if (stateId) params.stateId = stateId;
    if (districtId) params.districtId = districtId;
    if (talukaId) params.talukaId = talukaId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('villages', '/masters/villages', false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, page, limit, search, stateId, districtId, talukaId]);

  // Filter options with cascading dependencies
  const stateOptions = useMemo(
    () => statesData.map((s: any) => ({ label: s.name, value: s.id })),
    [statesData]
  );

  const filteredDistrictOptions = useMemo(() => {
    const raw = stateId
      ? districtsData.filter((d: any) => String(d.stateId) === String(stateId))
      : districtsData;
    return raw.map((d: any) => ({ label: d.name, value: d.id }));
  }, [districtsData, stateId]);

  const filteredTalukaOptions = useMemo(() => {
    const raw = districtId
      ? talukasData.filter((t: any) => String(t.districtId) === String(districtId))
      : stateId
        ? talukasData.filter((t: any) => String(t.stateId) === String(stateId))
        : talukasData;
    return raw.map((t: any) => ({ label: t.name, value: t.id }));
  }, [talukasData, districtId, stateId]);

  // Client-side filtering
  const filteredVillages = useMemo(() => {
    return villagesData.filter((item: any) => {
      if (stateId && String(item.stateId) !== String(stateId)) return false;
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (talukaId && String(item.talukaId) !== String(talukaId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchTaluka = item.talukaName?.toLowerCase().includes(query);
        const matchDistrict = item.districtName?.toLowerCase().includes(query);
        const matchState = item.stateName?.toLowerCase().includes(query);
        if (!matchName && !matchTaluka && !matchDistrict && !matchState) return false;
      }
      return true;
    });
  }, [villagesData, search, stateId, districtId, talukaId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStateId('');
    setDistrictId('');
    setTalukaId('');
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
        setTalukaId('');
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
        setTalukaId('');
        setPage(1);
      },
      options: filteredDistrictOptions,
      placeholder: 'All Districts',
    },
    {
      key: 'talukaId',
      label: 'Taluka',
      type: 'select',
      value: talukaId,
      onChange: (val) => {
        setTalukaId(val);
        setPage(1);
      },
      options: filteredTalukaOptions,
      placeholder: 'All Talukas',
    },
  ];

  // Columns Definition
  const columns: Column<any>[] = [
    { key: 'name', header: 'Village Name', sortable: true },
    { key: 'talukaName', header: 'Taluka (Tehsil)', sortable: true, render: (row) => row.talukaName || '-' },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => row.districtName || '-' },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => row.stateName || '-' },
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

  const handleSave = async (data: { name: string; stateId: string; districtId: string; talukaId: string }) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('villages', '/masters/villages', editingItem.id, data)
        );
        toast.success('Village updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('villages', '/masters/villages', data)
        );
        toast.success('Village created successfully!');
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
        deleteSuperAdminMasterCategoryItem('villages', '/masters/villages', itemToDelete.id)
      );
      toast.success('Village deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredVillages.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredVillages, 'Villages_List', ['name', 'talukaName', 'districtName', 'stateName']);
    toast.success('Villages exported successfully');
  };

  const handleImport = async (file: File, _?: any, context?: Record<string, any>) => {
    try {
      await dispatch(
        startBulkImportFileJob(
          'villages',
          file,
          () => {
            const params: Record<string, any> = { page, limit };
            if (stateId) params.stateId = stateId;
            if (districtId) params.districtId = districtId;
            if (talukaId) params.talukaId = talukaId;
            if (search.trim()) params.search = search.trim();
            dispatch(fetchSuperAdminMasterCategoryData('villages', '/masters/villages', false, params));
          },
          context || { stateId, districtId, talukaId }
        )
      );
      toast.success('Bulk import job started for Villages!');
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
        title="Villages"
        icon={<MapPin className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage revenue villages for voter demographic and residential address tracking."
        onAddClick={handleOpenAdd}
        addLabel="Add Village"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Villages, Talukas, Districts..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          loading={loading}
          columns={columns}
          data={villagesData}
          showHeader={false}
          serverPagination={
            villagesPagination
              ? {
                page: villagesPagination.page,
                limit: villagesPagination.limit,
                total: villagesPagination.total,
                totalPages: villagesPagination.totalPages,
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

      <VillageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        talukas={talukasData}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Village"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Villages"
        categoryKey="villages"
        sampleParams={{ stateId, districtId, talukaId }}
      />
    </div>
  );
};

export default VillagesPage;
