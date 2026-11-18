import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarCheck,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react';
import {
  fetchSuperAdminElections,
  createSuperAdminElection,
  updateSuperAdminElection,
  deleteSuperAdminElection,
} from '@/redux/actions/superAdminElection';
import { useMasterData } from '@/hooks/useMasterData';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import {
  ELECTION_STATUS_OPTIONS,
  ELECTION_TYPE_OPTIONS,
} from '@/constants/dropdownOptions';
import type {
  SuperAdminElection,
  CreateSuperAdminElectionPayload,
  UpdateSuperAdminElectionPayload,
} from '@/types/election.types';
import { SuperAdminElectionModal } from './components/SuperAdminElectionModal';
import { AssignTenantsModal } from './components/AssignTenantsModal';

export const SuperAdminElectionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { elections, total, loading } = useAppSelector(
    (state) => state.superAdminElection
  );
  const { states = [] } = useMasterData(['states']);

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStateId, setFilterStateId] = useState('');

  // Modal States
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuperAdminElection | null>(null);

  // Assign Tenants Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [electionForAssign, setElectionForAssign] = useState<SuperAdminElection | null>(null);

  // Delete Confirmation State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SuperAdminElection | null>(null);

  // Debounced API Fetching (Rule 13)
  useDebouncedEffect(
    () => {
      const filters: Record<string, any> = { page, limit };
      if (search.trim()) filters.search = search.trim();
      if (filterStatus) filters.status = filterStatus;
      if (filterType) filters.electionType = filterType;
      if (filterStateId) filters.stateId = filterStateId;

      dispatch(fetchSuperAdminElections(filters));
    },
    200,
    [search, filterStatus, filterType, filterStateId, page, limit]
  );

  // Filter Fields Configuration
  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        value: filterStatus,
        onChange: (val) => {
          setFilterStatus(val);
          setPage(1);
        },
        options: ELECTION_STATUS_OPTIONS,
        placeholder: 'All Statuses',
      },
      {
        key: 'electionType',
        label: 'Election Type',
        type: 'select',
        value: filterType,
        onChange: (val) => {
          setFilterType(val);
          setPage(1);
        },
        options: ELECTION_TYPE_OPTIONS,
        placeholder: 'All Types',
      },
      {
        key: 'stateId',
        label: 'State',
        type: 'select',
        value: filterStateId,
        onChange: (val) => {
          setFilterStateId(val);
          setPage(1);
        },
        options: [
          { label: 'All States', value: '' },
          ...states.map((s: any) => ({ label: s.name, value: s.id })),
        ],
        placeholder: 'All States',
      },
    ],
    [filterStatus, filterType, filterStateId, states]
  );

  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterType('');
    setFilterStateId('');
    setPage(1);
  };

  // Submit Handler for Create / Edit
  const handleFormSubmit = async (
    payload: CreateSuperAdminElectionPayload | UpdateSuperAdminElectionPayload
  ) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await dispatch(updateSuperAdminElection(editingItem.id, payload));
        toast.success('Master election updated successfully');
      } else {
        await dispatch(createSuperAdminElection(payload as CreateSuperAdminElectionPayload));
        toast.success('Master election created successfully');
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save election');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteSuperAdminElection(itemToDelete.id));
      toast.success('Master election deleted successfully');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete election');
    } finally {
      setIsDeleting(false);
    }
  };

  // Data Table Columns
  const columns: Column<SuperAdminElection>[] = [
    {
      key: 'name',
      header: 'Election Name & Code',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {row.name}
          </span>
          {row.electionCode && (
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              #{row.electionCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'electionType',
      header: 'Type',
      render: (row) => {
        const typeLabels: Record<string, string> = {
          ASSEMBLY: 'Assembly (VS)',
          PARLIAMENTARY: 'Parliamentary (LS)',
          MUNICIPAL_CORP: 'Municipal Corp',
          ZILLA_PARISHAD: 'Zilla Parishad',
          PANCHAYAT_SAMITI: 'Panchayat Samiti',
          GRAM_PANCHAYAT: 'Gram Panchayat',
          OTHER: 'Other',
        };
        return (
          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
            {typeLabels[row.electionType] || row.electionType}
          </span>
        );
      },
    },
    {
      key: 'stateName',
      header: 'Constituency Scope',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>{row.stateName || 'All States'}</span>
          </div>
          {(row.pcName || row.acName) && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {[row.pcName && `PC: ${row.pcName}`, row.acName && `AC: ${row.acName}`]
                .filter(Boolean)
                .join(' • ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'electionDate',
      header: 'Polling Date',
      render: (row) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const pDate = row.electionDate ? String(row.electionDate).split('T')[0] : '';
        const isToday = pDate && pDate === todayStr;
        const diffDays = pDate
          ? Math.ceil(
              (new Date(pDate).getTime() - new Date(todayStr).getTime()) /
                (1000 * 3600 * 24)
            )
          : null;

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{pDate || 'Not Set'}</span>
            </div>
            {isToday ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
                Polling Today
              </span>
            ) : diffDays !== null && diffDays > 0 ? (
              <span className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">
                In {diffDays} day{diffDays > 1 ? 's' : ''}
              </span>
            ) : diffDays !== null ? (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {Math.abs(diffDays)} day{Math.abs(diffDays) > 1 ? 's' : ''} ago
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'assignedTenantsCount',
      header: 'Assigned Tenants',
      render: (row) => {
        const count = row.assignedTenantsCount || 0;
        return (
          <button
            type="button"
            onClick={() => {
              setElectionForAssign(row);
              setIsAssignModalOpen(true);
            }}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 cursor-pointer"
            title="Click to manage assigned tenant organizations"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {count} {count === 1 ? 'Tenant' : 'Tenants'}
            </span>
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusColors: Record<string, string> = {
          UPCOMING: 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400',
          ACTIVE: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
          COMPLETED: 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
          ARCHIVED: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        };
        return (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              statusColors[row.status] ||
              'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Election Master"
        subtitle="Centralized management of national, state, and local election cycles, schedules, and tenant assignments"
        icon={<CalendarCheck size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {total} {total === 1 ? 'Record' : 'Records'}
          </span>
        }
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Master Election"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search master elections by title or code..."
        filters={filterFields}
        onReset={handleClearFilters}
      />

      <DataTable
        columns={columns}
        data={elections}
        loading={loading}
        showHeader={false}
        serverPagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
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
            extra={
              <button
                type="button"
                onClick={() => {
                  setElectionForAssign(row);
                  setIsAssignModalOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                title="Assign Election to Tenants"
              >
                <Users className="w-4 h-4" />
              </button>
            }
          />
        )}
      />

      <SuperAdminElectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isSaving={isSaving}
      />

      <AssignTenantsModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setElectionForAssign(null);
        }}
        election={electionForAssign}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Master Election"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? If this election is currently assigned to tenants with no voting telemetry, it will be cleanly removed; otherwise it will be safely archived to protect voter turnout integrity.`}
        confirmText="Delete Master Election"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default SuperAdminElectionsPage;
