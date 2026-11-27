import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Map } from 'lucide-react';
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
import { TalukaFormModal } from '@/components/common/master/form';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export const TenantTalukasPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Load master reference options using useTenantMasterData hook
  const { districts: districtsData = [], states: statesData = [] } = useTenantMasterData(['districts', 'states']);
  const talukasData = useAppSelector((state) => state.master.talukas || []);

  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const endpoint = API_ENDPOINTS.TENANT.MASTERS.TALUKAS;

  // Debounced backend fetch for talukas data with filter parameters
  useDebouncedEffect(() => {
    let active = true;
    setLoading(true);

    const params: Record<string, string> = {};
    if (districtId) params.districtId = districtId;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchTenantMasterCategoryData('talukas', endpoint, false, params)).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, 250, [dispatch, districtId, search]);

  // Auto-select district if single district available in tenant scope
  useDebouncedEffect(() => {
    if (districtsData?.length === 1 && !districtId) {
      setDistrictId(String(districtsData[0].id));
    }
  }, 50, [districtsData, districtId]);

  // Client-side filtering
  const filteredTalukas = useMemo(() => {
    return talukasData.filter((item: any) => {
      if (districtId && String(item.districtId) !== String(districtId)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(query);
        const distMatch = item.districtName?.toLowerCase().includes(query);
        const stateMatch = item.stateName?.toLowerCase().includes(query);
        return nameMatch || distMatch || stateMatch;
      }
      return true;
    });
  }, [talukasData, districtId, search]);

  const handleResetFilters = () => {
    setSearch('');
    setDistrictId(districtsData.length === 1 ? String(districtsData[0].id) : '');
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await dispatch(updateTenantMasterCategoryItem('talukas', endpoint, editingItem.id, data));
        toast.success('Taluka updated successfully!');
      } else {
        await dispatch(createTenantMasterCategoryItem('talukas', endpoint, data));
        toast.success('Taluka created successfully!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Taluka');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantMasterCategoryItem('talukas', endpoint, itemToDelete.id));
      toast.success('Taluka deleted successfully!');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Taluka');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (!filteredTalukas.length) {
      toast.error('No talukas available to export');
      return;
    }
    const exportRows = filteredTalukas.map((t: any) => ({
      'Taluka Name': t.name,
      'District': t.districtName || '-',
      'State': t.stateName || '-',
    }));
    exportToExcel(exportRows, 'Talukas_List');
    toast.success('Talukas exported successfully!');
  };

  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [];

    if (districtsData.length > 1) {
      fields.push({
        key: 'districtId',
        label: 'District',
        type: 'select',
        value: districtId,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => setDistrictId(val),
        options: [{ label: 'All Districts', value: '' }, ...districtsData.map((d: any) => ({ label: d.name, value: d.id }))],
        isPrimary: true,
      });
    }

    return fields;
  }, [districtsData, districtId]);

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Taluka Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-[10.5px] text-slate-900 dark:text-slate-100 leading-tight">{row.name}</span>,
    },
    {
      key: 'districtName',
      header: 'District',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.districtName || '-'}</span>,
    },
    {
      key: 'stateName',
      header: 'State',
      sortable: true,
      render: (row) => <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">{row.stateName || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Talukas (Tehsils)"
        subtitle="Manage administrative taluka divisions within your campaign jurisdiction."
        icon={<Map size={22} />}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Taluka"
        onExportClick={handleExport}
      />

      <DataTable
        columns={columns}
        data={filteredTalukas}
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
            searchPlaceholder="Search talukas, districts, states..."
            onSearchChange={setSearch}
          />
        }
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

      <TalukaFormModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        states={statesData}
        districts={districtsData}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
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
        title="Delete Taluka"
        description="Are you sure you want to delete this Taluka? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TenantTalukasPage;
