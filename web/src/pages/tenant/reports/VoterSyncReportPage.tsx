import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Users,
  UserCheck,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchVoterSyncReport, exportReportExcel } from '@/redux/actions/reports';
import { fetchTenantVolunteers } from '@/redux/actions/volunteer';
import type { VoterSyncReportItem } from '@/redux/reducers/reports';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import {
  DataTable,
  TablePrimaryText,
  TableSecondaryText,
  TableMonoText,
  type Column,
} from '@/components/common/DataTable';
import { FilterBar, type FilterField, type Option } from '@/components/common/FilterBar';
import type { DateRangeValue } from '@/components/common/DatePicker';
import { SafeImage } from '@/components/common/SafeImage';
import { CountUp } from '@/components/common/CountUp';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';

const ROLE_BADGE_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pc_leader: { label: 'PC Leader', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Shield },
  ac_leader: { label: 'AC Leader', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Award },
  sub_leader: { label: 'Sub-Leader', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Users },
  supporter: { label: 'Volunteer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: UserCheck },
};

export const VoterSyncReportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, total, page, limit, totalPages, summary, loading } = useAppSelector(
    (state) => state.reports.voterSync
  );
  const volunteers = useAppSelector((state) => state.volunteer.volunteers);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useDebouncedEffect(
    () => {
      dispatch(fetchTenantVolunteers());
    },
    150,
    [dispatch]
  );

  useDebouncedEffect(
    () => {
      const filters: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
      };
      if (search.trim()) filters.search = search.trim();
      if (role) filters.role = role;
      if (volunteerId) filters.volunteerId = volunteerId;
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;

      dispatch(fetchVoterSyncReport(filters));
    },
    200,
    [dispatch, search, role, volunteerId, dateRange, currentPage, pageSize]
  );

  const volunteerOptions: Option[] = useMemo(() => {
    const filtered = role ? volunteers.filter((v) => v.role === role) : volunteers;
    return [
      { label: 'All Volunteers', value: '' },
      ...filtered.map((v) => ({
        label: v.name,
        value: v.id,
        subtitle: v.mobile ? formatPhoneNumber(v.mobile) : undefined,
      })),
    ];
  }, [volunteers, role]);

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'role',
        label: 'Volunteer Role',
        type: 'select',
        value: role,
        defaultValue: '',
        isPrimary: true,
        options: VOLUNTEER_ROLE_OPTIONS,
        onChange: (val) => {
          setRole(val);
          if (val && volunteerId) {
            const match = volunteers.find((v) => v.id === volunteerId);
            if (match && match.role !== val) {
              setVolunteerId('');
            }
          }
          setCurrentPage(1);
        },
      },
      {
        key: 'volunteerId',
        label: 'Volunteer',
        type: 'select',
        value: volunteerId,
        defaultValue: '',
        isPrimary: true,
        placeholder: 'All Volunteers',
        options: volunteerOptions,
        onChange: (val) => {
          setVolunteerId(val);
          setCurrentPage(1);
        },
      },
      {
        key: 'dateRange',
        label: 'Synced Date',
        type: 'daterange',
        value: dateRange,
        placeholder: 'Select date range',
        onChange: (val) => {
          setDateRange(val || { startDate: '', endDate: '' });
          setCurrentPage(1);
        },
      },
    ],
    [role, volunteerId, volunteerOptions, volunteers, dateRange]
  );

  const handleReset = () => {
    setSearch('');
    setRole('');
    setVolunteerId('');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const filters: Record<string, any> = {};
      if (search.trim()) filters.search = search.trim();
      if (role) filters.role = role;
      if (volunteerId) filters.volunteerId = volunteerId;
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;

      await dispatch(
        exportReportExcel('/tenant/reports/voter-sync/export', filters, 'Voter_Sync_Report.xlsx')
      );
      toast.success('Voter sync report exported');
    } catch {
      toast.error('Failed to export voter sync report');
    }
  };

  const columns: Column<VoterSyncReportItem>[] = useMemo(
    () => [
      {
        key: 'voterName',
        header: 'Voter Details',
        render: (row) => (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <SafeImage
              src={row.voterAvatar}
              alt={row.voterName || row.voterEngName || 'Voter'}
              fallbackText={row.voterName || row.voterEngName || 'V'}
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              containerClassName="w-8 h-8 rounded-lg shrink-0"
            />
            <div className="space-y-0.5 min-w-0">
              <TablePrimaryText as="div" className="truncate max-w-[170px]">
                {row.voterName || row.voterEngName || 'Unnamed Voter'}
              </TablePrimaryText>
              {row.voterEngName && row.voterName && row.voterEngName !== row.voterName && (
                <TableSecondaryText as="div" className="truncate max-w-[170px]">
                  {row.voterEngName}
                </TableSecondaryText>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <TableMonoText accent bold>
                  {row.epicNo}
                </TableMonoText>
                {row.gender && (
                  <TableSecondaryText>
                    • {row.gender}{row.age ? `, ${row.age}y` : ''}
                  </TableSecondaryText>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'voterMobile',
        header: 'Voter Phone & Booth',
        render: (row) => (
          <div className="space-y-1 min-w-[150px]">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <TableMonoText bold>
                {row.voterMobile ? formatPhoneNumber(row.voterMobile) : '—'}
              </TableMonoText>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <TableSecondaryText className="truncate max-w-[180px]">
                {row.boothNo ? `Booth ${row.boothNo}` : 'No Booth'}
                {row.wardName ? ` • ${row.wardName}` : ''}
              </TableSecondaryText>
            </div>
          </div>
        ),
      },
      {
        key: 'volunteerName',
        header: 'Volunteer Details',
        render: (row) => (
          <div className="flex items-center gap-2.5 min-w-[190px]">
            <SafeImage
              src={row.volunteerAvatar}
              alt={row.volunteerName}
              fallbackText={row.volunteerName}
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              <TablePrimaryText className="truncate max-w-[160px]">
                {row.volunteerName}
              </TablePrimaryText>
              <TableMonoText muted>
                {row.volunteerMobile ? formatPhoneNumber(row.volunteerMobile) : 'No Phone'}
              </TableMonoText>
            </div>
          </div>
        ),
      },
      {
        key: 'volunteerRole',
        header: 'Volunteer Role',
        render: (row) => {
          const badge = ROLE_BADGE_MAP[row.volunteerRole] || {
            label: row.volunteerRoleName || row.volunteerRole,
            color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            icon: UserCheck,
          };
          const RoleIcon = badge.icon;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-semibold border ${badge.color}`}
            >
              <RoleIcon size={11} />
              {badge.label}
            </span>
          );
        },
      },
      {
        key: 'syncedAt',
        header: 'Synced At',
        render: (row) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <TableSecondaryText>
              {row.syncedAt
                ? new Date(row.syncedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </TableSecondaryText>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Voter Sync to Volunteer"
        subtitle="Matched voter records synced from field volunteer phonebooks with volunteer contact and role details"
        icon={<Smartphone />}
        onExportClick={handleExport}
        exportLabel="Export Excel"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                Total Synced Records
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                <CountUp to={summary.totalSyncedPairs} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <Smartphone size={17} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Unique Voters Synced
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                <CountUp to={summary.uniqueVotersSynced} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <Users size={17} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Active Syncing Volunteers
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                <CountUp to={summary.activeSyncingVolunteers} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <UserCheck size={17} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar + DataTable */}
      <DataTable<VoterSyncReportItem>
        showHeader={false}
        columns={columns}
        data={items}
        loading={loading}
        filterBar={
          <FilterBar
            embedded
            showDrawerButton={false}
            searchPlaceholder="Search voter name, EPIC, phone, or volunteer..."
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            filters={filterFields}
            onReset={handleReset}
          />
        }
        serverPagination={{
          page,
          limit,
          total,
          totalPages,
          onPageChange: (newPage) => setCurrentPage(newPage),
          onLimitChange: (newLimit) => {
            setPageSize(newLimit);
            setCurrentPage(1);
          },
        }}
      />
    </div>
  );
};

export default VoterSyncReportPage;
