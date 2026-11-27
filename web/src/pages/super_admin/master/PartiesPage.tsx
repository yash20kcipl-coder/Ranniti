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
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PartyFormModal } from '@/components/common/master/form';
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
        const matchColor = item.color?.toLowerCase().includes(query);
        if (!matchName && !matchAbbr && !matchAlliance && !matchColor) return false;
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
      defaultValue: '',
      excludeFromCount: true,
      onChange: setAllianceFilter,
      options: [{ label: 'All Alliances', value: '' }, ...allianceOptions],
      isPrimary: true,
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
    {
      key: 'name',
      header: 'Party Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'abbreviation',
      header: 'Abbreviation / Code',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {row.abbreviation || '-'}
        </span>
      ),
    },
    {
      key: 'color',
      header: 'Color',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
            style={{ backgroundColor: row.color || '#94a3b8' }}
          />
          <span className="font-mono text-[9.5px] text-slate-700 dark:text-slate-300 uppercase">
            {row.color || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'alliance',
      header: 'Alliance',
      render: (row) => (
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
          {row.alliance || '-'}
        </span>
      ),
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
    exportToExcel(filteredParties, 'Parties_List', ['name', 'abbreviation', 'color', 'alliance']);
    toast.success('Political Parties exported successfully');
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
        title="Political Parties"
        icon={<Flag className="w-6 h-6 text-indigo-500" />}
        subtitle="Manage recognized political party references & symbols."
        onAddClick={handleOpenAdd}
        addLabel="Add Party"
        onExportClick={handleExport}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
      />

      <DataTable
        columns={columns}
        data={filteredParties}
        loading={loading}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchPlaceholder="Search Party Name, Code, Alliance..."
            searchValue={search}
            showDrawerButton={false}
            showResetButton={false}
            onSearchChange={setSearch}
            filters={filterFields}
            onReset={handleResetFilters}
          />
        }
        actions={(row) => (
          <TableActions
            onEdit={() => handleOpenEdit(row)}
            onDelete={() => handleOpenDelete(row)}
          />
        )}
      />

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

    </div>
  );
};

export default PartiesPage;
