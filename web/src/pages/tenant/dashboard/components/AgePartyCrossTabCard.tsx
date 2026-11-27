import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooterLink } from '@/components/common/Card';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface AgePartyCrossTabCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

const formatShortCount = (num: number): string => {
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return num.toLocaleString();
};

const formatShare = (part: number, total: number): string => {
  if (total <= 0 || part <= 0) return '0%';
  const pct = (part / total) * 100;
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
};

export const AgePartyCrossTabCard: React.FC<AgePartyCrossTabCardProps> = ({ data, loading }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const cohorts = useMemo(() => data?.agePartyBreakdown || [], [data?.agePartyBreakdown]);

  const {
    columns,
    partySeries,
    hasParties,
    totalAgedVoters,
    totalUndecided,
    peakIdx,
    maxColValue,
  } = useMemo(() => {
    const totalsMap: Record<string, { key: string; name: string; color: string; count: number }> = {};

    cohorts.forEach((c) => {
      c.parties.forEach((p) => {
        const key = p.partyId || 'undecided';
        if (!totalsMap[key]) {
          totalsMap[key] = {
            key,
            name: p.partyId ? p.partyName : 'Undecided / swing',
            color: p.partyId ? p.color || '#4338CA' : '#F59E0B',
            count: 0,
          };
        }
        totalsMap[key].count += p.count;
      });
    });

    const sortedSeries = Object.values(totalsMap)
      .filter((s) => s.count > 0)
      .sort((a, b) => {
        if (a.key === 'undecided') return 1;
        if (b.key === 'undecided') return -1;
        return b.count - a.count;
      })
      .slice(0, 6);

    const anyParties = sortedSeries.some((s) => s.key !== 'undecided');

    let totalAll = 0;
    let totalUndec = 0;
    let maxVal = 0;
    let maxUndecided = -1;
    let maxUndecidedIdx = 0;

    const cols = cohorts.map((c, idx) => {
      const undecidedCount = c.parties.find((p) => !p.partyId)?.count || 0;
      const displayVal = anyParties ? c.total : undecidedCount || c.total;
      totalAll += c.total;
      totalUndec += undecidedCount;
      if (displayVal > maxVal) maxVal = displayVal;
      if (undecidedCount > maxUndecided) {
        maxUndecided = undecidedCount;
        maxUndecidedIdx = idx;
      }

      const segments = sortedSeries.map((s) => {
        const match = c.parties.find((p) => (p.partyId || 'undecided') === s.key);
        return {
          key: s.key,
          name: s.name,
          color: s.color,
          count: match ? match.count : 0,
        };
      });

      return {
        label: c.label,
        total: c.total,
        undecidedCount,
        displayVal,
        segments,
      };
    });

    return {
      columns: cols,
      partySeries: sortedSeries,
      hasParties: anyParties,
      totalAgedVoters: totalAll,
      totalUndecided: totalUndec,
      peakIdx: maxUndecidedIdx,
      maxColValue: Math.max(maxVal, 1),
    };
  }, [cohorts]);

  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="chart"
        title="Voters by age group"
        subtitle="See which age groups are still undecided"
        icon={<BarChart3 size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[488px]"
      />
    );
  }

  const activeIdx = hoveredIdx === null ? peakIdx : hoveredIdx;
  const peakCol = columns[peakIdx];

  const shareDenom = hasParties ? totalAgedVoters : totalUndecided || totalAgedVoters;

  return (
    <Card
      title="Voters by age group"
      subtitle={
        hasParties
          ? 'See which age groups support each party and where undecided voters are'
          : 'See which age groups are still undecided'
      }
      icon={<BarChart3 size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        peakCol ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 whitespace-nowrap">
            <span className="w-[7px] h-[7px] rounded-full bg-[#F59E0B] shrink-0" />
            Most undecided: {peakCol.label}
          </span>
        ) : undefined
      }
      headerClassName="border-[#EEF1F6] dark:border-slate-800/60"
      contentClassName="flex-1 flex flex-col"
      footerClassName="bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/60"
      footer={
        <CardFooterLink
          hint={
            hasParties
              ? `${totalAgedVoters.toLocaleString()} voters across ${columns.length} age groups`
              : 'Party support will show here once volunteers record it in surveys'
          }
          label="View voter list"
          to="/dashboard/voters"
        />
      }
      className="flex flex-col justify-between h-full"
    >
      {totalAgedVoters === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <BarChart3 size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-300">
            No age details available yet
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Age and party breakdown will appear once voter records are added.
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 justify-between space-y-6">
          {/* Legend Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] dark:text-slate-400">
              {hasParties ? 'Voters in each age group' : 'Undecided voters in each age group'}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {hasParties ? (
                partySeries.map((s) => (
                  <span
                    key={s.key}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] dark:text-slate-300"
                  >
                    <span
                      className="w-2 h-2 rounded-[3px] shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#92400E] dark:text-amber-300">
                  <span className="w-2 h-2 rounded-[3px] bg-[#F59E0B] shrink-0" />
                  Undecided / swing
                </span>
              )}
            </div>
          </div>

          {/* Column Plot Area */}
          <div className="flex-1 flex flex-col">
            <div
              className="flex-1 flex gap-3 sm:gap-4 min-h-[220px] px-1 border-b border-[#CBD5E1] dark:border-slate-700"
              style={{
                backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
                backgroundSize: '100% 25%',
              }}
            >
              {columns.map((col, idx) => {
                const isActive = idx === activeIdx;
                const heightPct = Math.max((col.displayVal / maxColValue) * 82, 3);

                return (
                  <button
                    key={col.label}
                    type="button"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => navigate('/dashboard/voters')}
                    aria-label={`${col.label}: ${col.displayVal.toLocaleString()} voters`}
                    className="flex-1 min-w-0 h-full flex flex-col items-center justify-end cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`text-[13px] mb-1.5 tabular-nums transition-colors ${isActive
                        ? 'font-extrabold text-[#0F172A] dark:text-white'
                        : 'font-semibold text-[#475569] dark:text-slate-400'
                        }`}
                    >
                      {formatShortCount(col.displayVal)}
                    </span>

                    {hasParties ? (
                      <div
                        className="w-full rounded-t-[8px] overflow-hidden flex flex-col-reverse transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      >
                        {col.segments.map((seg) => {
                          if (seg.count <= 0) return null;
                          const segPct = (seg.count / Math.max(col.displayVal, 1)) * 100;
                          return (
                            <div
                              key={seg.key}
                              style={{
                                height: `${segPct}%`,
                                backgroundColor: seg.color,
                                opacity: isActive ? 1 : 0.85,
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <span
                        className="block w-full rounded-t-[8px] transition-all duration-300"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isActive ? '#F59E0B' : '#FDE68A',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex gap-3 sm:gap-5 px-1 pt-2">
              {columns.map((col, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div key={col.label} className="flex-1 min-w-0 text-center">
                    <div
                      className={`text-[13px] truncate ${isActive
                        ? 'font-bold text-[#0F172A] dark:text-white'
                        : 'font-semibold text-[#475569] dark:text-slate-300'
                        }`}
                    >
                      {col.label}
                    </div>
                    <div className="text-[12px] text-[#64748B] dark:text-slate-400 tabular-nums">
                      {formatShare(
                        hasParties ? col.total : col.undecidedCount,
                        shareDenom
                      )}{' '}
                      of voters
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
