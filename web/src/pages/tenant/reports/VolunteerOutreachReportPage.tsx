import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  MessageSquare,
  Smartphone,
  Users,
  RefreshCw,
  Activity,
  Shield,
  Award,
  UserCheck,
  TrendingUp,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchVolunteerAnalytics } from '@/redux/actions/volunteer';
import { fetchVolunteerOutreachVoters, exportReportExcel } from '@/redux/actions/reports';
import type { VolunteerLeaderboardItem } from '@/redux/reducers/volunteer';
import type { VolunteerOutreachVoterItem } from '@/redux/reducers/reports';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { CountUp } from '@/components/common/CountUp';
import { SafeImage } from '@/components/common/SafeImage';
import {
  DataTable,
  TablePrimaryText,
  TableSecondaryText,
  TableMonoText,
  TableBadge,
  type Column,
} from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pc_leader: { label: 'PC Leader', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Shield },
  ac_leader: { label: 'AC Leader', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Award },
  sub_leader: { label: 'Sub-Leader', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Users },
  supporter: { label: 'Volunteer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: UserCheck },
};

const ACTION_TYPE_LABELS: Record<'sync' | 'call' | 'whatsapp', string> = {
  sync: 'Contacts Synced',
  call: 'Calls Made',
  whatsapp: 'WhatsApp Sent',
};

export const VolunteerOutreachReportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { analytics, analyticsLoading } = useAppSelector((state) => state.volunteer);
  const {
    items: modalVoters,
    total: modalTotal,
    page: modalPage,
    limit: modalLimit,
    totalPages: modalTotalPages,
    loading: modalLoading,
  } = useAppSelector((state) => state.reports.outreachVoters);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Popup modal state for clicking on volunteer counts
  const [modalTarget, setModalTarget] = useState<{
    volunteer: VolunteerLeaderboardItem;
    type: 'sync' | 'call' | 'whatsapp';
    count: number;
  } | null>(null);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(15);

  useDebouncedEffect(
    () => {
      dispatch(
        fetchVolunteerAnalytics({
          timeRange,
          role: roleFilter || undefined,
        })
      );
    },
    200,
    [dispatch, timeRange, roleFilter]
  );

  // Fetch voter details whenever modal target or pagination changes
  useDebouncedEffect(
    () => {
      if (!modalTarget) return;
      dispatch(
        fetchVolunteerOutreachVoters({
          volunteerId: modalTarget.volunteer.id,
          type: modalTarget.type,
          timeRange,
          page: modalCurrentPage,
          limit: modalPageSize,
        })
      );
    },
    100,
    [dispatch, modalTarget, timeRange, modalCurrentPage, modalPageSize]
  );

  const handleOpenVoterModal = (
    volunteer: VolunteerLeaderboardItem,
    type: 'sync' | 'call' | 'whatsapp',
    count: number
  ) => {
    setModalCurrentPage(1);
    setModalTarget({ volunteer, type, count });
  };

  const handleRefresh = () => {
    dispatch(
      fetchVolunteerAnalytics({
        timeRange,
        role: roleFilter || undefined,
      })
    );
  };

  const handleExport = async () => {
    try {
      await dispatch(
        exportReportExcel(
          '/tenant/reports/volunteer-outreach/export',
          { timeRange, role: roleFilter || undefined },
          'Volunteer_Outreach_Report.xlsx'
        )
      );
      toast.success('Volunteer outreach report exported');
    } catch {
      toast.error('Failed to export volunteer outreach report');
    }
  };

  const kpis = analytics?.kpis || {
    totalContactsSynced: 0,
    totalCallsInitiated: 0,
    totalWhatsAppSent: 0,
    totalSmsSent: 0,
    totalVoterTouches: 0,
    activeVolunteersCount: 0,
    totalVolunteersCount: 0,
  };

  const rawLeaderboard: VolunteerLeaderboardItem[] = analytics?.leaderboard || [];

  const filteredLeaderboard = useMemo(() => {
    return rawLeaderboard.filter((item) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.mobile && item.mobile.includes(q)) ||
        item.roleName.toLowerCase().includes(q)
      );
    });
  }, [rawLeaderboard, searchTerm]);

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'role',
        label: 'Volunteer Role',
        type: 'select',
        value: roleFilter,
        defaultValue: '',
        isPrimary: true,
        options: VOLUNTEER_ROLE_OPTIONS,
        onChange: (val) => setRoleFilter(val),
      },
    ],
    [roleFilter]
  );

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('');
  };

  const columns: Column<VolunteerLeaderboardItem>[] = useMemo(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        align: 'center',
        width: '64px',
        render: (_row, idx) => {
          const rank = idx + 1;
          if (rank === 1) {
            return (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-[11px] shadow-2xs">
                🥇
              </span>
            );
          }
          if (rank === 2) {
            return (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-extrabold text-[11px]">
                🥈
              </span>
            );
          }
          if (rank === 3) {
            return (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-extrabold text-[11px]">
                🥉
              </span>
            );
          }
          return (
            <TableMonoText muted bold>
              #{rank}
            </TableMonoText>
          );
        },
      },
      {
        key: 'name',
        header: 'Volunteer',
        render: (item) => (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <SafeImage
              src={item.avatar}
              alt={item.name}
              fallbackText={item.name}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shrink-0"
              containerClassName="w-8 h-8 rounded-lg shrink-0"
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              <TablePrimaryText className="truncate max-w-[160px]">
                {item.name}
              </TablePrimaryText>
              <TableMonoText muted>
                {formatPhoneNumber(item.mobile)}
              </TableMonoText>
            </div>
          </div>
        ),
      },
      {
        key: 'roleName',
        header: 'Role Tier',
        render: (item) => {
          const cfg = ROLE_BADGES[item.role] || {
            label: item.roleName,
            color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            icon: Users,
          };
          const RoleIcon = cfg.icon;
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-semibold border ${cfg.color}`}>
              <RoleIcon size={11} />
              {cfg.label}
            </span>
          );
        },
      },
      {
        key: 'assignedBoothsCount',
        header: 'Assigned Territory',
        align: 'center',
        sortable: true,
        render: (item) => (
          <div className="flex flex-col items-center gap-0.5">
            <TableMonoText bold>
              {item.assignedBoothsCount > 0 ? `${item.assignedBoothsCount} Booths` : '—'}
            </TableMonoText>
            <TableMonoText muted>
              {item.assignedVotersCount > 0
                ? `${item.assignedVotersCount.toLocaleString()} voters`
                : '0 voters'}
            </TableMonoText>
          </div>
        ),
      },
      {
        key: 'contactsSynced',
        header: 'Contacts Synced',
        align: 'right',
        sortable: true,
        render: (item) => (
          <button
            type="button"
            disabled={item.contactsSynced === 0}
            onClick={() => handleOpenVoterModal(item, 'sync', item.contactsSynced)}
            title={item.contactsSynced > 0 ? 'View synced voters' : undefined}
            className={
              item.contactsSynced > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="purple"
              className={item.contactsSynced > 0 ? 'hover:ring-2 hover:ring-purple-500/30' : ''}
            >
              <Smartphone size={11} />
              {item.contactsSynced.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'callsCount',
        header: 'Calls Made',
        align: 'right',
        sortable: true,
        render: (item) => (
          <button
            type="button"
            disabled={item.callsCount === 0}
            onClick={() => handleOpenVoterModal(item, 'call', item.callsCount)}
            title={item.callsCount > 0 ? 'View called voters' : undefined}
            className={
              item.callsCount > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="info"
              className={item.callsCount > 0 ? 'hover:ring-2 hover:ring-blue-500/30' : ''}
            >
              <PhoneCall size={11} />
              {item.callsCount.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'whatsAppCount',
        header: 'WhatsApp Sent',
        align: 'right',
        sortable: true,
        render: (item) => (
          <button
            type="button"
            disabled={item.whatsAppCount === 0}
            onClick={() => handleOpenVoterModal(item, 'whatsapp', item.whatsAppCount)}
            title={item.whatsAppCount > 0 ? 'View WhatsApp contacted voters' : undefined}
            className={
              item.whatsAppCount > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="success"
              className={item.whatsAppCount > 0 ? 'hover:ring-2 hover:ring-emerald-500/30' : ''}
            >
              <MessageSquare size={11} />
              {item.whatsAppCount.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'totalTouches',
        header: 'Coverage & Touches',
        align: 'right',
        sortable: true,
        render: (item) => (
            <div
              className="flex flex-col items-end gap-0.5"
              title={`${item.uniqueVotersTouched.toLocaleString()} unique voters reached out of ${item.assignedVotersCount.toLocaleString()} assigned voters`}
            >
              <TableMonoText bold>
                {item.totalTouches.toLocaleString()} touches
              </TableMonoText>
                <TableMonoText accent bold>
                  {item.engagementScore}% coverage
                </TableMonoText>
            </div>
            ),
      },
            ],
            []
            );

            const modalColumns: Column<VolunteerOutreachVoterItem>[] = useMemo(() => {
    const baseCols: Column<VolunteerOutreachVoterItem>[] = [
                {
                  key: 'voterName',
                header: 'Voter Details',
        render: (row) => (
                <div className="flex items-center gap-2.5 min-w-[190px]">
                  <SafeImage
                    src={row.voterAvatar}
                    alt={row.voterName || row.voterEngName || 'Voter'}
                    fallbackText={row.voterName || row.voterEngName || 'V'}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    containerClassName="w-8 h-8 rounded-lg shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <TablePrimaryText as="div" className="truncate max-w-[160px]">
                      {row.voterName || row.voterEngName || 'Unnamed Voter'}
                    </TablePrimaryText>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TableMonoText accent bold>
                        {row.epicNo || '—'}
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
                header: 'Phone & Booth',
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
                      {row.boothNo ? `Booth #${row.boothNo}` : 'No Booth'}
                      {row.wardName ? ` • ${row.wardName}` : ''}
                    </TableSecondaryText>
                  </div>
                </div>
                ),
      },
                ];

                if (modalTarget?.type === 'sync') {
                  baseCols.push({
                    key: 'contactName',
                    header: 'Saved Contact Info',
                    render: (row) => (
                      <div className="space-y-0.5 min-w-[130px]">
                        <TablePrimaryText as="div">
                          {row.contactName || '—'}
                        </TablePrimaryText>
                        <TableMonoText muted as="div">
                          {row.contactPhone ? formatPhoneNumber(row.contactPhone) : '—'}
                        </TableMonoText>
                      </div>
                    ),
                  });
    }

                baseCols.push({
                  key: 'activityAt',
                header: modalTarget?.type === 'sync' ? 'Synced At' : 'Date & Time',
      render: (row) => (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <TableSecondaryText>
                    {row.activityAt
                      ? new Date(row.activityAt).toLocaleString('en-IN', {
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
    });

                return baseCols;
  }, [modalTarget?.type]);

                return (
                <div className="space-y-4 pb-8">
                  <PageHeader
                    title="Volunteer Outreach & Performance"
                    subtitle="Field worker activity on voter phonebook syncs, direct phone dials, and WhatsApp campaigns"
                    icon={<Activity />}
                    onExportClick={handleExport}
                    exportLabel="Export Excel"
                    actions={
                      <div className="flex items-center gap-2">
                        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <button
                            type="button"
                            onClick={() => setTimeRange('7d')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${timeRange === '7d'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                          >
                            7 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeRange('30d')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${timeRange === '30d'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                          >
                            30 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeRange('all')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${timeRange === 'all'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                          >
                            All Time
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleRefresh}
                          disabled={analyticsLoading}
                          title="Refresh Analytics"
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin text-indigo-500' : ''}`} />
                        </button>
                      </div>
                    }
                  />

                  {/* Top 4 KPI Cards (Gradient style matching VolunteerStatsCards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50/90 via-white to-purple-50/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-purple-950/20 border border-violet-200/90 dark:border-violet-900/60 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 block">
                            Contacts Synced
                          </span>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            <CountUp to={kpis.totalContactsSynced} duration={1} />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-md bg-violet-600 text-white shadow-md shadow-violet-500/25 flex items-center justify-center shrink-0">
                          <Smartphone size={17} />
                        </div>
                      </div>
                      <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        Phonebook → Voter Roll
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-cyan-950/20 border border-blue-200/90 dark:border-blue-900/60 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                            Calls Initiated
                          </span>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            <CountUp to={kpis.totalCallsInitiated} duration={1} />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-md bg-blue-600 text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
                          <PhoneCall size={17} />
                        </div>
                      </div>
                      <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        Direct Phone Dial Actions
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                            WhatsApp Touches
                          </span>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            <CountUp to={kpis.totalWhatsAppSent} duration={1} />
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-md bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
                          <MessageSquare size={17} />
                        </div>
                      </div>
                      <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        Template Messages Sent
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                            Active Volunteers
                          </span>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
                            <CountUp to={kpis.activeVolunteersCount} duration={1} />
                            <span className="text-sm font-semibold text-slate-400">
                              / {kpis.totalVolunteersCount}
                            </span>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
                          <TrendingUp size={17} />
                        </div>
                      </div>
                      <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {kpis.totalVolunteersCount > 0
                          ? `${Math.round((kpis.activeVolunteersCount / kpis.totalVolunteersCount) * 100)}% of team active`
                          : '0% of team active'}
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Table (Single FilterBar, no duplicate header search) */}
                  <DataTable<VolunteerLeaderboardItem>
                    showHeader={false}
                    columns={columns}
                    data={filteredLeaderboard}
                    loading={analyticsLoading}
                    filterBar={
                      <FilterBar
                        embedded
                        showDrawerButton={false}
                        searchPlaceholder="Search volunteer name, phone, or role..."
                        searchValue={searchTerm}
                        onSearchChange={(val) => setSearchTerm(val)}
                        filters={filterFields}
                        onReset={handleReset}
                      />
                    }
                  />

                  {/* Voter Details Popup Modal on Count Press */}
                  <Modal
                    isOpen={Boolean(modalTarget)}
                    onClose={() => setModalTarget(null)}
                    title={
                      modalTarget
                        ? `${modalTarget.volunteer.name} — ${ACTION_TYPE_LABELS[modalTarget.type]}`
                        : ''
                    }
                    subtitle={
                      modalTarget
                        ? `${formatPhoneNumber(modalTarget.volunteer.mobile)} • ${modalTarget.count.toLocaleString()} ${ACTION_TYPE_LABELS[modalTarget.type].toLowerCase()}`
                        : ''
                    }
                    maxWidth="4xl"
                    contentPadding="none"
                  >
                    <DataTable<VolunteerOutreachVoterItem>
                      showHeader={false}
                      columns={modalColumns}
                      data={modalVoters}
                      loading={modalLoading}
                      serverPagination={{
                        page: modalPage,
                        limit: modalLimit,
                        total: modalTotal,
                        totalPages: modalTotalPages,
                        onPageChange: (newPage) => setModalCurrentPage(newPage),
                        onLimitChange: (newLimit) => {
                          setModalPageSize(newLimit);
                          setModalCurrentPage(1);
                        },
                      }}
                    />
                  </Modal>
                </div>
                );
};

                export default VolunteerOutreachReportPage;
