import { Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchSuperAdminMasterCategoryData,
  createSuperAdminMasterCategoryItem,
  updateSuperAdminMasterCategoryItem,
  deleteSuperAdminMasterCategoryItem,
  syncAllSuperAdminMasters,
} from '@/redux/actions/masterSuperAdmin';
import React, { useState, useMemo } from 'react';
import { exportToExcel } from '@/utils/exportImport';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import { ImportModal } from '@/components/common/ImportModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PartyFormModal } from '@/components/common/master/form';
import { startBulkImportFileJob } from '@/redux/actions/importJobs';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

export const PartiesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const partiesData = useAppSelector((state) => state.master.parties || []);

  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States (1 filter -> inline)
  const [search, setSearch] = useState('');
  const [allianceFilter, setAllianceFilter] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Debounced backend fetch for parties data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (allianceFilter) params.alliance = allianceFilter;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchSuperAdminMasterCategoryData('parties', '/masters/parties', false, params))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, 250, [dispatch, search, allianceFilter]);

  // Dynamically extract alliance options from existing data or standard list
  const allianceOptions = useMemo(() => {
    const set = new Set<string>();
    partiesData.forEach((p: any) => {
      if (p.alliance) set.add(p.alliance);
    });
    return Array.from(set).map((a) => ({ label: a, value: a }));
  }, [partiesData]);

  // Client-side filtering
  const filteredParties = useMemo(() => {
    return partiesData.filter((item: any) => {
      if (allianceFilter && String(item.alliance || '') !== String(allianceFilter)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchAbbr = item.abbreviation?.toLowerCase().includes(query);
        const matchAlliance = item.alliance?.toLowerCase().includes(query);
        if (!matchName && !matchAbbr && !matchAlliance) return false;
      }
      return true;
    });
  }, [partiesData, search, allianceFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setAllianceFilter('');
  };

  const filterFields: FilterField[] = allianceOptions.length > 0 ? [
    {
      key: 'alliance',
      label: 'Alliance',
      type: 'select',
      value: allianceFilter,
      onChange: setAllianceFilter,
      options: allianceOptions,
      placeholder: 'All Alliances',
    },
  ] : [];

  // Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'symbolLogo',
      header: 'Symbol / Logo',
      render: (row) => (
        <SafeImage
          alt={row.name}
          src={row.symbolLogo}
          fallbackText={row.abbreviation || row.name}
          className="w-8 h-8 object-contain rounded-md border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-xs"
        />
      ),
    },
    { key: 'name', header: 'Party Name', sortable: true },
    { key: 'abbreviation', header: 'Abbreviation / Code', sortable: true },
    { key: 'alliance', header: 'Alliance', render: (row) => row.alliance || '-' },
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

  const handleSave = async (data: Record<string, any>) => {
    try {
      if (editingItem) {
        await dispatch(
          updateSuperAdminMasterCategoryItem('parties', '/masters/parties', editingItem.id, data)
        );
        toast.success('Political Party updated successfully!');
      } else {
        await dispatch(
          createSuperAdminMasterCategoryItem('parties', '/masters/parties', data)
        );
        toast.success('Political Party created successfully!');
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
        deleteSuperAdminMasterCategoryItem('parties', '/masters/parties', itemToDelete.id)
      );
      toast.success('Political Party deleted successfully!');
      setDeleteModalOpen(false);
    } catch {
      // Handled in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredParties.length) {
      toast.error('No data available to export');
      return;
    }
    exportToExcel(filteredParties, 'Parties_List', ['name', 'abbreviation', 'alliance']);
    toast.success('Political Parties exported successfully');
  };

  const handleImport = async (file: File) => {
    try {
      await dispatch(
        startBulkImportFileJob('parties', file, () => {
          const params: Record<string, string> = {};
          if (search.trim()) params.search = search.trim();
          dispatch(fetchSuperAdminMasterCategoryData('parties', '/masters/parties', false, params));
        })
      );
      toast.success('Bulk import job started for Political Parties!');
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
        title="Political Parties"
        icon={<Flag className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage recognized political party references & symbols."
        onAddClick={handleOpenAdd}
        addLabel="Add Party"
        onImportClick={() => setIsImportModalOpen(true)}
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <FilterBar
        searchPlaceholder="Search Party Name, Code, Alliance..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredParties}
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

      <PartyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Party"
        message={`Are you sure you want to delete "${itemToDelete?.name || ''}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        title="Import Parties"
        categoryKey="parties"
      />
    </div>
  );
};

export default PartiesPage;
