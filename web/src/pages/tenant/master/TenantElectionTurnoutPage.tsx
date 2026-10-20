import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Building2,
  AlertTriangle,
  RefreshCw,
  Star,
  Flame,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchTenantElectionById,
  fetchBoothTurnout,
  fetchHourlyTurnout,
} from '@/redux/actions/election';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import type { Election, BoothTurnoutItem } from '@/types/election.types';

export const TenantElectionTurnoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedElection, boothTurnout = [], hourlyTurnout = [], turnoutLoading } = useAppSelector(
    (state) => state.election
  );

  const [electionData, setElectionData] = useState<Election | null>(selectedElection);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'average' | 'strong'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 1. Fetch Election Details
  useEffect(() => {
    if (id) {
      dispatch(fetchTenantElectionById(id)).then((data) => {
        if (data) setElectionData(data);
      });
    }
  }, [id, dispatch]);

  // 2. Fetch Turnout and Hourly Data (Rule 13)
  useDebouncedEffect(
    () => {
      if (id) {
        dispatch(fetchBoothTurnout(id));
        dispatch(fetchHourlyTurnout(id));
      }
    },
    150,
    [id, dispatch]
  );

  // 3. Optional Auto-Refresh Poll every 30s
  useEffect(() => {
    if (!autoRefresh || !id) return;
    const interval = setInterval(() => {
      dispatch(fetchBoothTurnout(id));
      dispatch(fetchHourlyTurnout(id));
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, id, dispatch]);

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchBoothTurnout(id)),
        dispatch(fetchHourlyTurnout(id)),
        dispatch(fetchTenantElectionById(id)).then((data) => {
          if (data) setElectionData(data);
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Turnout Summary Statistics
  const summaryMetrics = useMemo(() => {
    const totalVoters = boothTurnout.reduce((acc, b) => acc + (b.totalVoters || 0), 0);
    const votedCount = boothTurnout.reduce((acc, b) => acc + (b.votedCount || 0), 0);
    const maleVoted = boothTurnout.reduce((acc, b) => acc + (b.maleVotedCount || 0), 0);
    const femaleVoted = boothTurnout.reduce((acc, b) => acc + (b.femaleVotedCount || 0), 0);
    const totalBooths = boothTurnout.length;
    const boothsWithVotes = boothTurnout.filter((b) => b.votedCount > 0).length;
    const criticalCount = boothTurnout.filter((b) => b.turnoutPercentage < 35).length;
    const averageCount = boothTurnout.filter((b) => b.turnoutPercentage >= 35 && b.turnoutPercentage < 50).length;
    const strongCount = boothTurnout.filter((b) => b.turnoutPercentage >= 50).length;

    const turnoutPercentage = totalVoters > 0
      ? Math.round((votedCount / totalVoters) * 1000) / 10
      : 0;

    return {
      totalVoters,
      votedCount,
      turnoutPercentage,
      maleVoted,
      femaleVoted,
      totalBooths,
      boothsWithVotes,
      criticalCount,
      averageCount,
      strongCount,
    };
  }, [boothTurnout]);

  // Max Slot Votes for Relative Chart Scaling
  const maxSlotVotes = useMemo(() => {
    if (hourlyTurnout.length === 0) return 1;
    return Math.max(1, ...hourlyTurnout.map((h) => h.votesCast || 0));
  }, [hourlyTurnout]);

  const peakSlot = useMemo(() => {
    if (hourlyTurnout.length === 0) return null;
    return [...hourlyTurnout].sort((a, b) => b.votesCast - a.votesCast)[0];
  }, [hourlyTurnout]);

  const formatSlotLabel = (slot: string) => {
    const hour = parseInt(slot.split(':')[0], 10);
    if (isNaN(hour)) return slot;
    const startPeriod = hour >= 12 ? 'PM' : 'AM';
    const startH = hour % 12 === 0 ? 12 : hour % 12;
    const nextH = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const nextPeriod = (hour + 1) >= 12 && (hour + 1) < 24 ? 'PM' : 'AM';
    return `${startH}:00 ${startPeriod} - ${nextH}:00 ${nextPeriod}`;
  };

  // Filtered booth items for DataTable
  const displayBooths = useMemo(() => {
    let list = boothTurnout;

    if (filterSeverity === 'critical') {
      list = list.filter((b) => b.turnoutPercentage < 35);
    } else if (filterSeverity === 'average') {
      list = list.filter((b) => b.turnoutPercentage >= 35 && b.turnoutPercentage < 50);
    } else if (filterSeverity === 'strong') {
      list = list.filter((b) => b.turnoutPercentage >= 50);
    }

    return list.map((b) => ({
      ...b,
      boothNumberTag: `#${b.boothNumber}`,
      reportingStatus: b.votedCount > 0 ? 'Reporting' : 'No Votes',
    }));
  }, [boothTurnout, filterSeverity]);

  // DataTable column definitions with standard Ranniti styles
  const columns = useMemo<Column<BoothTurnoutItem & { boothNumberTag: string; reportingStatus: string }>[]>(
    () => [
      {
        key: 'boothNumber',
        header: 'Booth #',
        sortable: true,
        width: '90px',
        render: (row) => (
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
            #{row.boothNumber || '-'}
          </span>
        ),
      },
      {
        key: 'boothName',
        header: 'Booth Location / Name',
        sortable: true,
        render: (row) => (
          <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
            {row.boothName || `Polling Booth #${row.boothNumber}`}
          </div>
        ),
      },
      {
        key: 'totalVoters',
        header: 'Electorate',
        sortable: true,
        align: 'right',
        width: '110px',
        render: (row) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {row.totalVoters.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'votedCount',
        header: 'Votes Polled',
        sortable: true,
        align: 'right',
        width: '130px',
        render: (row) => (
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
              {row.votedCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
              M: {row.maleVotedCount} • F: {row.femaleVotedCount}
            </span>
          </div>
        ),
      },
      {
        key: 'turnoutPercentage',
        header: 'Turnout Rate & Progress',
        sortable: true,
        align: 'center',
        width: '170px',
        render: (row) => {
          const isLow = row.turnoutPercentage < 35;
          const isMid = row.turnoutPercentage >= 35 && row.turnoutPercentage < 50;

          return (
            <div className="flex flex-col items-center gap-1 max-w-[130px] mx-auto">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLow
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    : isMid
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
              >
                {row.turnoutPercentage}%
              </span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLow ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, row.turnoutPercentage)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        key: 'reportingStatus',
        header: 'Coverage Status',
        align: 'center',
        width: '120px',
        render: (row) =>
          row.votedCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Reporting
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              No Votes
            </span>
          ),
      },
      {
        key: 'lastVotedAt',
        header: 'Last Vote Telemetry',
        sortable: true,
        align: 'right',
        width: '140px',
        render: (row) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {row.lastVotedAt
              ? new Date(row.lastVotedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        ),
      },
    ],
    []
  );

  const electionName = electionData?.name || selectedElection?.name || 'Election';

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <PageHeader
        title={`${electionName} — Live Polling War Room`}
        subtitle="Real-time booth turnout monitoring, hourly voting speed velocity, and field mobilization"
        icon={<Activity size={22} className="text-emerald-500 animate-pulse" />}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY
            </span>
            {electionData?.isDefault && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                Active Default
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tenant-master/elections')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Elections
            </button>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Automatically refresh every 30 seconds"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Auto-Sync {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={turnoutLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || turnoutLoading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>
        }
      />

      {/* Top 4 Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Electorate */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Registered Electorate
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {summaryMetrics.totalVoters.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered across {summaryMetrics.totalBooths} polling booths
            </p>
          </div>
        </div>

        {/* Votes Polled */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Votes Polled
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {summaryMetrics.votedCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Male: {summaryMetrics.maleVoted.toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-pink-600 dark:text-pink-400 font-semibold">
                Female: {summaryMetrics.femaleVoted.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Cumulative Turnout Rate */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cumulative Turnout Rate
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                {summaryMetrics.turnoutPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Poll Day Turnout
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summaryMetrics.turnoutPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Booths Reporting */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Field Booths Reporting
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400 tracking-tight">
                {summaryMetrics.boothsWithVotes}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">/ {summaryMetrics.totalBooths} booths</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summaryMetrics.totalBooths > 0
                ? Math.round((summaryMetrics.boothsWithVotes / summaryMetrics.totalBooths) * 100)
                : 0}
              % coverage active
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Voting Velocity & Surge Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Hourly Polling Surge & Voter Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track peak voting surges to coordinate relief shifts and transport logistics
              </p>
            </div>
          </div>

          {peakSlot && peakSlot.votesCast > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 animate-bounce" />
              <span>
                Peak Surge Slot: <strong className="font-bold">{formatSlotLabel(peakSlot.timeSlot)}</strong> ({peakSlot.votesCast.toLocaleString()} votes)
              </span>
            </div>
          )}
        </div>

        {hourlyTurnout.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 opacity-40 text-indigo-400" />
            No hourly votes reported yet for this election. Telemetry updates automatically as booth agents log votes.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {hourlyTurnout.map((slot, idx) => {
              const fillPct = Math.min(100, Math.round((slot.votesCast / maxSlotVotes) * 100));
              const isPeak = peakSlot && peakSlot.timeSlot === slot.timeSlot;

              return (
                <div
                  key={slot.timeSlot || idx}
                  className={`p-3 rounded-lg border transition-all ${
                    isPeak
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold ${isPeak ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {slot.timeSlot}
                    </span>
                    {isPeak && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                        PEAK
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {slot.votesCast.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">votes cast</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPeak ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Standard Ranniti DataTable for Booth Turnout */}
      <DataTable
        title="Booth-Wise Turnout Directory"
        subtitle="Filter by turnout rate to pinpoint lagging booths and deploy emergency voter mobilization"
        searchPlaceholder="Search by booth number, location..."
        columns={columns}
        data={displayBooths}
        loading={turnoutLoading && boothTurnout.length === 0}
        filterSlot={
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700/80 p-0.5 bg-slate-100/90 dark:bg-slate-800/80 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({summaryMetrics.totalBooths})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('critical')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                filterSeverity === 'critical'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <AlertTriangle size={12} />
              Critical &lt; 35% ({summaryMetrics.criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('average')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === 'average'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              Avg 35–50% ({summaryMetrics.averageCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('strong')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === 'strong'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              Strong ≥ 50% ({summaryMetrics.strongCount})
            </button>
          </div>
        }
      />
    </div>
  );
};

export default TenantElectionTurnoutPage;
