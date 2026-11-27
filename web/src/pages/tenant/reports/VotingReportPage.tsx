import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import {
  Vote,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTenantElections } from '@/redux/actions/election';
import {
  fetchVotingReport,
  fetchBoothVotingVoters,
  exportReportExcel,
} from '@/redux/actions/reports';
import type { VotingReportBoothItem, VotingReportVoterItem } from '@/redux/reducers/reports';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { DataTable, TablePrimaryText, TableSecondaryText, TableMonoText, TableBadge, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { FormInput } from '@/components/common/FormInput';
import { CountUp } from '@/components/common/CountUp';
import { SafeImage } from '@/components/common/SafeImage';
import { VOTED_FILTER_OPTIONS } from '@/constants/dropdownOptions';
import { formatPhoneNumber } from '@/utils/phoneUtils';

export const VotingReportPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const { elections, defaultElection } = useAppSelector((state) => state.election);
  const { election, summary, view, items, total, page, limit, totalPages, loading } = useAppSelector(
    (state) => state.reports.voting
  );
  const {
    items: modalVoters,
    total: modalTotal,
    page: modalPage,
    limit: modalLimit,
    totalPages: modalTotalPages,
    loading: modalLoading,
  } = useAppSelector((state) => state.reports.votingBoothVoters);

  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [reportView, setReportView] = useState<'booth' | 'voter'>('booth');
  const [hasVotedFilter, setHasVotedFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [modalTarget, setModalTarget] = useState<{
    booth: VotingReportBoothItem;
    status: 'all' | 'true' | 'false';
    label: string;
    count: number;
  } | null>(null);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(15);

  // Load elections list for selector
  useDebouncedEffect(
    () => {
      if (elections.length === 0) {
        dispatch(fetchTenantElections({ limit: 50 }));
      }
    },
    150,
    [dispatch, elections.length]
  );

  // Fetch voting report whenever filters change
  useDebouncedEffect(
    () => {
      const effectiveElectionId = selectedElectionId || defaultElection?.id || '';
      const filters: Record<string, any> = {
        view: reportView,
        page: currentPage,
        limit: pageSize,
      };
      if (effectiveElectionId) filters.electionId = effectiveElectionId;
      if (hasVotedFilter === 'true' || hasVotedFilter === 'false') {
        filters.hasVoted = hasVotedFilter;
      } else {
        filters.hasVoted = 'all';
      }
      if (search.trim()) filters.search = search.trim();

      dispatch(fetchVotingReport(filters));
    },
    200,
    [dispatch, selectedElectionId, defaultElection?.id, reportView, hasVotedFilter, search, currentPage, pageSize]
  );

  const electionOptions = useMemo(() => {
    return elections.map((e) => ({
      label: `${e.name}${e.isDefault ? ' (Active)' : ''}`,
      value: e.id,
    }));
  }, [elections]);

  const activeElectionId = selectedElectionId || election?.id || defaultElection?.id || '';

  useDebouncedEffect(
    () => {
      if (!modalTarget) return;
      dispatch(
        fetchBoothVotingVoters({
          electionId: activeElectionId || undefined,
          boothId: modalTarget.booth.boothId,
          hasVoted: modalTarget.status,
          page: modalCurrentPage,
          limit: modalPageSize,
        })
      );
    },
    100,
    [dispatch, modalTarget, activeElectionId, modalCurrentPage, modalPageSize]
  );

  const handleOpenBoothVoterModal = (
    booth: VotingReportBoothItem,
    status: 'all' | 'true' | 'false',
    label: string,
    count: number
  ) => {
    setModalCurrentPage(1);
    setModalTarget({ booth, status, label, count });
  };

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'hasVoted',
        label: reportView === 'booth' ? 'Booth Activity' : 'Voting Status',
        type: 'select',
        value: hasVotedFilter,
        defaultValue: '',
        isPrimary: true,
        options:
          reportView === 'booth'
            ? [
              { label: 'All Booths', value: '' },
              { label: 'Votes Recorded', value: 'true' },
              { label: 'Zero Votes Recorded', value: 'false' },
            ]
            : VOTED_FILTER_OPTIONS,
        onChange: (val) => {
          setHasVotedFilter(val);
          setCurrentPage(1);
        },
      },
    ],
    [reportView, hasVotedFilter]
  );

  const handleReset = () => {
    setSearch('');
    setHasVotedFilter('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const filters: Record<string, any> = {
        view: reportView,
        hasVoted: hasVotedFilter === 'true' || hasVotedFilter === 'false' ? hasVotedFilter : 'all',
      };
      if (activeElectionId) filters.electionId = activeElectionId;
      if (search.trim()) filters.search = search.trim();

      await dispatch(
        exportReportExcel(
          '/tenant/reports/voting/export',
          filters,
          reportView === 'voter' ? 'Voting_Report_Voters.xlsx' : 'Voting_Report_Booths.xlsx'
        )
      );
      toast.success('Voting report exported');
    } catch {
      toast.error('Failed to export voting report');
    }
  };

  const boothColumns: Column<VotingReportBoothItem>[] = useMemo(
    () => [
      {
        key: 'boothNo',
        header: 'Booth',
        render: (row) => (
          <div className="space-y-0.5 min-w-[160px]">
            <TablePrimaryText as="div">
              Booth #{row.boothNo}
            </TablePrimaryText>
            <TableSecondaryText as="div" className="truncate max-w-[240px]">
              {row.boothName}{row.wardName ? ` • ${row.wardName}` : ''}
            </TableSecondaryText>
          </div>
        ),
      },
      {
        key: 'totalVoters',
        header: 'Total Voters',
        align: 'right',
        render: (row) => (
          <button
            type="button"
            disabled={row.totalVoters === 0}
            onClick={() => handleOpenBoothVoterModal(row, 'all', 'All Voters', row.totalVoters)}
            title={row.totalVoters > 0 ? 'View all voters in this booth' : undefined}
            className={
              row.totalVoters > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="indigo"
              className={row.totalVoters > 0 ? 'hover:ring-2 hover:ring-indigo-500/30' : ''}
            >
              {row.totalVoters.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'votedCount',
        header: 'Voted',
        align: 'right',
        render: (row) => (
          <button
            type="button"
            disabled={row.votedCount === 0}
            onClick={() => handleOpenBoothVoterModal(row, 'true', 'Voted', row.votedCount)}
            title={row.votedCount > 0 ? 'View voters who voted' : undefined}
            className={
              row.votedCount > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="success"
              className={row.votedCount > 0 ? 'hover:ring-2 hover:ring-emerald-500/30' : ''}
            >
              {row.votedCount.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'notVotedCount',
        header: 'Pending',
        align: 'right',
        render: (row) => (
          <button
            type="button"
            disabled={row.notVotedCount === 0}
            onClick={() => handleOpenBoothVoterModal(row, 'false', 'Pending Voters', row.notVotedCount)}
            title={row.notVotedCount > 0 ? 'View pending voters' : undefined}
            className={
              row.notVotedCount > 0
                ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95'
                : 'cursor-default opacity-60'
            }
          >
            <TableBadge
              variant="warning"
              className={row.notVotedCount > 0 ? 'hover:ring-2 hover:ring-amber-500/30' : ''}
            >
              {row.notVotedCount.toLocaleString()}
            </TableBadge>
          </button>
        ),
      },
      {
        key: 'genderSplit',
        header: 'M / F Voted',
        align: 'center',
        render: (row) => (
          <TableMonoText>
            {row.maleVotedCount} / {row.femaleVotedCount}
          </TableMonoText>
        ),
      },
      {
        key: 'turnoutPercentage',
        header: 'Turnout %',
        render: (row) => {
          const pct = row.turnoutPercentage || 0;
          const barColor =
            pct >= 50
              ? 'bg-emerald-500'
              : pct >= 35
                ? 'bg-amber-500'
                : 'bg-rose-500';
          return (
            <div className="flex items-center gap-2.5 min-w-[120px]">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <TableMonoText bold className="w-10 text-right shrink-0">
                {pct}%
              </TableMonoText>
            </div>
          );
        },
      },
    ],
    []
  );

  const voterColumns: Column<VotingReportVoterItem>[] = useMemo(
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
              <div className="flex items-center gap-2">
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
        key: 'boothNo',
        header: 'Booth & Phone',
        render: (row) => (
          <div className="space-y-0.5 min-w-[150px]">
            <TablePrimaryText as="div">
              {row.boothNo ? `Booth #${row.boothNo}` : 'No Booth'}
              {row.wardName ? ` • ${row.wardName}` : ''}
            </TablePrimaryText>
            <TableMonoText muted as="div">
              {row.voterMobile ? formatPhoneNumber(row.voterMobile) : 'No Phone'}
            </TableMonoText>
          </div>
        ),
      },
      {
        key: 'hasVoted',
        header: 'Voting Status',
        render: (row) =>
          row.hasVoted ? (
            <TableBadge variant="success">Voted</TableBadge>
          ) : (
            <TableBadge variant="neutral">Not Voted</TableBadge>
          ),
      },
      {
        key: 'votedAt',
        header: 'Marked At',
        render: (row) => (
          <TableSecondaryText className="whitespace-nowrap">
            {row.votedAt
              ? new Date(row.votedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
              : '—'}
          </TableSecondaryText>
        ),
      },
      {
        key: 'markedByName',
        header: 'Marked By Volunteer',
        render: (row) => (
          <div className="space-y-0.5">
            <TablePrimaryText as="div">
              {row.markedByName || '—'}
            </TablePrimaryText>
            {row.markedByMobile && (
              <TableMonoText muted as="div">
                {formatPhoneNumber(row.markedByMobile)}
              </TableMonoText>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const toggleContainerRef = useRef<HTMLDivElement>(null);
  const boothBtnRef = useRef<HTMLButtonElement>(null);
  const voterBtnRef = useRef<HTMLButtonElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const updatePill = () => {
    const activeBtn = reportView === 'booth' ? boothBtnRef.current : voterBtnRef.current;
    const container = toggleContainerRef.current;
    if (!activeBtn || !container) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  };

  useLayoutEffect(() => {
    updatePill();
  }, [reportView]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [reportView]);

  const viewToggle = (
    <div
      ref={toggleContainerRef}
      className="relative inline-flex p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-xs shrink-0 h-9 items-center"
    >
      {pillStyle && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 bottom-0.5 left-0 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-700/50 shadow-2xs pointer-events-none z-0 will-change-transform"
          style={{
            transform: `translateX(${pillStyle.left}px)`,
            width: `${pillStyle.width}px`,
            transition: 'transform 240ms cubic-bezier(0.2, 0, 0, 1), width 240ms cubic-bezier(0.2, 0, 0, 1)',
          }}
        />
      )}
      <button
        ref={boothBtnRef}
        type="button"
        onClick={() => {
          setReportView('booth');
          setHasVotedFilter('');
          setCurrentPage(1);
        }}
        className={`relative z-10 px-3 h-full rounded-xl font-semibold transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${reportView === 'booth'
          ? 'text-indigo-600 dark:text-indigo-300'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
      >
        <Building2 className="w-3.5 h-3.5" />
        Booth-wise
      </button>
      <button
        ref={voterBtnRef}
        type="button"
        onClick={() => {
          setReportView('voter');
          setHasVotedFilter('');
          setCurrentPage(1);
        }}
        className={`relative z-10 px-3 h-full rounded-xl font-semibold transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${reportView === 'voter'
          ? 'text-indigo-600 dark:text-indigo-300'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
      >
        <Users className="w-3.5 h-3.5" />
        Voter-wise
      </button>
    </div>
  );

      return (
      <div className="space-y-4 pb-8">
        <PageHeader
          title="Voting Report by Election"
          subtitle="Election-wise polling turnout summary across booths and individual voter voting status"
          icon={<Vote />}
          onExportClick={handleExport}
          exportLabel="Export Excel"
          actions={
            <div className="w-full sm:w-72">
              <FormInput
                type="select"
                size="md"
                searchable={false}
                clearable={false}
                inputClassName="!rounded-xl !h-9 sm:!h-9.5 !text-xs"
                value={activeElectionId}
                onChange={(val) => {
                  setSelectedElectionId(String(val));
                  setCurrentPage(1);
                }}
                options={
                  electionOptions.length > 0
                    ? electionOptions
                    : [{ label: 'No elections configured', value: '' }]
                }
              />
            </div>
          }
        />

        {/* Turnout KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  Total Voters
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  <CountUp to={summary.totalVoters} />
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
                <Vote size={17} />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Across {summary.totalBooths.toLocaleString()} Polling Booths
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  Votes Cast
                </span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <CountUp to={summary.votedCount} />
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
                <CheckCircle2 size={17} />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {summary.maleVotedCount.toLocaleString()} Male • {summary.femaleVotedCount.toLocaleString()} Female
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-900/60 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                  Pending Voters
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  <CountUp to={summary.notVotedCount} />
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
                <Clock size={17} />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {Math.max(0, 100 - summary.turnoutPercentage).toFixed(1)}% remaining to vote
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50/90 via-white to-purple-50/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-purple-950/20 border border-violet-200/90 dark:border-violet-900/60 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 block">
                  Overall Turnout
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {summary.turnoutPercentage}%
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-violet-600 text-white shadow-md shadow-violet-500/25 flex items-center justify-center shrink-0">
                <TrendingUp size={17} />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {summary.boothsWithVotes.toLocaleString()} of {summary.totalBooths.toLocaleString()} booths active
            </p>
          </div>
        </div>

        {/* Report DataTable */}
        {view === 'booth' ? (
          <DataTable<VotingReportBoothItem>
            showHeader={false}
            columns={boothColumns}
            data={items as VotingReportBoothItem[]}
            loading={loading}
            filterBar={
              <FilterBar
                embedded
                showDrawerButton={false}
                searchPlaceholder="Search booth number, name, or ward..."
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                filters={filterFields}
                extraActions={viewToggle}
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
        ) : (
          <DataTable<VotingReportVoterItem>
            showHeader={false}
            columns={voterColumns}
            data={items as VotingReportVoterItem[]}
            loading={loading}
            filterBar={
              <FilterBar
                embedded
                showDrawerButton={false}
                searchPlaceholder="Search voter name, EPIC no, or phone..."
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                filters={filterFields}
                extraActions={viewToggle}
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
        )}

        {/* Booth Voter Details Popup Modal on Count Press */}
        <Modal
          isOpen={Boolean(modalTarget)}
          onClose={() => setModalTarget(null)}
          title={
            modalTarget
              ? `Booth #${modalTarget.booth.boothNo} — ${modalTarget.label}`
              : ''
          }
          subtitle={
            modalTarget
              ? `${modalTarget.booth.boothName} • ${modalTarget.count.toLocaleString()} ${modalTarget.label.toLowerCase()}`
              : ''
          }
          maxWidth="4xl"
          contentPadding="none"
        >
          <DataTable<VotingReportVoterItem>
            showHeader={false}
            columns={voterColumns}
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

      export default VotingReportPage;
