import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Landmark } from 'lucide-react';
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
import { AcFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantAcsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useTenantMasterData hook
  const { pcs: pcsData = [], districts: districtsData = [], states: statesData = [] } = useTenantMasterData([
    'pcs',
    'districts',
    'states',
  ]);
  const acsData = useAppSelector((state) => state.master.acs || []);

  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterPcId, setFilterPcId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.ACS;

  // Debounced backend fetch for acs data with filter parameters (without pagination)
  useDebouncedEffect(
    () => {
      let active = true;
      setLoading(true);

      const params: Record<string, any> = {};
      if (filterPcId) params.pcId = filterPcId;
      if (search.trim()) params.search = search.trim();

      dispatch(fetchTenantMasterCategoryData('acs', endpoint, false, params)).finally(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
      };
    },
    200,
    [dispatch, search, filterPcId]
  );

  const handleResetFilters = () => {
    setSearch('');
    setFilterPcId('');
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('acs', endpoint, editingItem.id, data));
        toast.success('Assembly Constituency updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('acs', endpoint, data));
        toast.success('Assembly Constituency created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Assembly Constituency');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('acs', endpoint, itemToDelete.id));
      toast.success('Assembly Constituency deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Assembly Constituency');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    if (!acsData || acsData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = acsData.map((item: any) => ({
      'AC No.': item.acNumber || '',
      'Assembly Name': item.name || '',
      State: item.stateName || '',
      District: item.districtName || '',
      'Parliamentary Constituency (PC)': item.pcName || '',
    }));
    exportToExcel(cleanData, 'Assembly_Constituencies_Export');
    toast.success('Excel file exported successfully!');
  };

  const columns: Column<any>[] = [
    { key: 'acNumber', header: 'AC No.', sortable: true },
    { key: 'name', header: 'Assembly Name', sortable: true },
    { key: 'stateName', header: 'State', sortable: true, render: (row) => row.stateName || '-' },
    { key: 'districtName', header: 'District', sortable: true, render: (row) => row.districtName || '-' },
    { key: 'pcName', header: 'PC', sortable: true, render: (row) => row.pcName || '-' },
  ];

  const pcOptions = useMemo(() => pcsData.map((p: any) => ({ label: p.name, value: p.id })), [pcsData]);

  const filterFields: FilterField[] = [
    {
      key: 'filterPcId',
      label: 'Parliamentary (PC)',
      type: 'select',
      value: filterPcId,
      onChange: (val) => {
        setFilterPcId(val);
      },
      options: [{ label: 'All PCs', value: '' }, ...pcOptions],
      isPrimary: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assembly Constituencies (AC)"
        subtitle="Manage Vidhan Sabha assembly constituencies scoped to your tenant."
        icon={<Landmark size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {acsData.length} {acsData.length === 1 ? 'Record' : 'Records'}
          </span>
        }
        onExportClick={handleExportExcel}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add AC"
      />

      <FilterBar
        searchPlaceholder="Search assembly constituencies..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      <div className="rounded-2xl dark:bg-slate-900/60 dark:border dark:border-slate-800 dark:p-1">
        <DataTable
          columns={columns}
          data={acsData}
          loading={loading}
          showHeader={false}
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

      <AcFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        pcs={pcsData}
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
        title="Delete Assembly Constituency"
        description="Are you sure you want to delete this Assembly Constituency? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantAcsPage;
