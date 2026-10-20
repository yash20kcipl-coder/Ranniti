import toast from 'react-hot-toast';
import {
  ELECTION_STATUS_OPTIONS,
  ELECTION_TYPE_OPTIONS,
} from '@/constants/dropdownOptions';
import {
  fetchTenantElections,
  createTenantElection,
  updateTenantElection,
  setDefaultTenantElection,
  syncDefaultElectionByDate,
  deleteTenantElection,
} from '@/redux/actions/election';
import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { ElectionModal } from './components/ElectionModal';
import { PageHeader } from '@/components/common/PageHeader';
import { Vote, Star, Calendar, Activity } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import type { Election, CreateElectionPayload, UpdateElectionPayload } from '@/types/election.types';

export const TenantElectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { elections, total, loading } = useAppSelector((state) => state.election);

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal States
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Election | null>(null);

  // Confirmation States
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Election | null>(null);

  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [defaultModalOpen, setDefaultModalOpen] = useState(false);
  const [itemToSetDefault, setItemToSetDefault] = useState<Election | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  // Debounced API Fetching (Rule 13)
  useDebouncedEffect(() => {
    const filters: Record<string, any> = { page, limit };
    if (search.trim()) filters.search = search.trim();
    if (filterStatus) filters.status = filterStatus;
    if (filterType) filters.electionType = filterType;

    dispatch(fetchTenantElections(filters));
  }, 200, [search, filterStatus, filterType, page, limit]);

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
    ],
    [filterStatus, filterType]
  );

  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterType('');
    setPage(1);
  };

  // Sync Default by Date Handler
  const handleSyncDefaultByDate = async () => {
    setIsSyncing(true);
    try {
      const synced = await dispatch(syncDefaultElectionByDate());
      if (synced) {
        toast.success(`Active election synchronized: "${synced.name}" is now default`);
      } else {
        toast.success('Election statuses and dates synchronized');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync default election');
    } finally {
      setIsSyncing(false);
    }
  };

  // Form Submit Handler
  const handleFormSubmit = async (payload: CreateElectionPayload | UpdateElectionPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await dispatch(updateTenantElection(editingItem.id, payload));
        toast.success('Election updated successfully');
      } else {
        await dispatch(createTenantElection(payload as CreateElectionPayload));
        toast.success('Election created successfully');
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
      await dispatch(deleteTenantElection(itemToDelete.id));
      toast.success('Election deleted successfully');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete election');
    } finally {
      setIsDeleting(false);
    }
  };

  // Set Default Handler
  const handleSetDefaultConfirm = async () => {
    if (!itemToSetDefault) return;
    setIsSettingDefault(true);
    try {
      await dispatch(setDefaultTenantElection(itemToSetDefault.id));
      toast.success(`"${itemToSetDefault.name}" is now the active campaign election`);
      setDefaultModalOpen(false);
      setItemToSetDefault(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to set default election');
    } finally {
      setIsSettingDefault(false);
    }
  };

  // Data Table Columns
  const columns: Column<Election>[] = [
    {
      key: 'name',
      header: 'Election Name & Code',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/tenant-master/elections/${row.id}/turnout`)}
              className="text-left font-slab font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              title="Open Live Turnout War Room"
            >
              {row.name}
            </button>
            {row.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Active Default
              </span>
            )}
          </div>
          {row.electionCode && (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Code: #{row.electionCode}
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
          ASSEMBLY: 'Assembly (Vidhan Sabha)',
          PARLIAMENTARY: 'Parliamentary (Lok Sabha)',
          MUNICIPAL_CORP: 'Municipal Corporation',
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
      key: 'electionDate',
      header: 'Polling Date',
      render: (row) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const pDate = row.electionDate ? String(row.electionDate).split('T')[0] : '';
        const isToday = pDate && pDate === todayStr;
        const diffDays = pDate ? Math.ceil((new Date(pDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24)) : null;

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
      key: 'countingDate',
      header: 'Counting Date',
      render: (row) => {
        const cDate = row.countingDate ? String(row.countingDate).split('T')[0] : '';
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{cDate || 'Not Announced'}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusColors: Record<string, string> = {
          UPCOMING: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          ACTIVE: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          COMPLETED: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
          ARCHIVED: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        };
        return (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[row.status] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'
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
        subtitle="Manage campaign election cycles, dates, registered voter targets, and polling turnout configurations"
        icon={<Vote size={22} />}
        badge={
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs">
            {total} {total === 1 ? 'Record' : 'Records'}
          </span>
        }
        onSyncClick={handleSyncDefaultByDate}
        syncLabel={isSyncing ? 'Syncing...' : 'Sync Default by Date'}
        onAddClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Election"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search elections..."
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
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/tenant-master/elections/${row.id}/turnout`)}
                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                  title="Open Live Polling War Room"
                >
                  <Activity className="w-4 h-4 text-emerald-500" />
                </button>
                {!row.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      setItemToSetDefault(row);
                      setDefaultModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
                    title="Set as Default / Active Election"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
              </div>
            }
          />
        )}
      />

      <ElectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isSaving={isSaving}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Election"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? All associated polling-day voter statuses and booth turnout metrics for this election will be permanently deleted.`}
        confirmText="Delete Election"
        variant="danger"
        loading={isDeleting}
      />

      <ConfirmModal
        isOpen={defaultModalOpen}
        onClose={() => {
          setDefaultModalOpen(false);
          setItemToSetDefault(null);
        }}
        onConfirm={handleSetDefaultConfirm}
        title="Set as Default Campaign Election"
        message={`Make "${itemToSetDefault?.name}" the active campaign election? This election will become the primary context for the Voter Directory, live polling-day turnout, and war room analytics.`}
        confirmText="Set as Default"
        variant="warning"
        loading={isSettingDefault}
      />
    </div>
  );
};

export default TenantElectionsPage;
