import React, { useMemo, useState } from 'react';
import { Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooterLink } from '@/components/common/Card';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface PartyLeaningCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

interface PartySegment {
  id: string;
  label: string;
  sublabel?: string;
  count: number;
  sharePct: number;
  color: string;
}

const UNDECIDED_COLOR = '#F59E0B';
const OTHER_GROUP_COLOR = '#64748B';
const FALLBACK_PARTY_COLOR = '#4338CA';

export const PartyLeaningCard: React.FC<PartyLeaningCardProps> = ({ data, loading }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'bars' | 'donut'>('bars');

  const { totalVoters = 0, partyBreakdown = [], boothId = null } = data || {};

  const {
    decidedParties,
    decidedCount,
    undecidedCount,
    decidedPct,
    undecidedPct,
    barRows,
    donutSegments,
  } = useMemo(() => {
    const parties = partyBreakdown
      .filter((p) => p.partyId && p.count > 0)
      .sort((a, b) => b.count - a.count);

    const undecidedEntry = partyBreakdown.find((p) => !p.partyId);
    const decidedTotal = parties.reduce((sum, item) => sum + item.count, 0);
    const undecidedTotal = undecidedEntry
      ? undecidedEntry.count
      : Math.max(0, totalVoters - decidedTotal);

    const denom = totalVoters > 0 ? totalVoters : decidedTotal + undecidedTotal;
    const knownPct = denom > 0 ? Math.round((decidedTotal / denom) * 100) : 0;
    const swingPct = denom > 0 ? Math.round((undecidedTotal / denom) * 100) : 0;

    const toShare = (count: number) => (denom > 0 ? (count / denom) * 100 : 0);

    const rows: PartySegment[] = [
      ...(undecidedTotal > 0 || parties.length === 0
        ? [
          {
            id: 'undecided',
            label: 'Undecided',
            count: undecidedTotal,
            sharePct: toShare(undecidedTotal),
            color: UNDECIDED_COLOR,
          },
        ]
        : []),
      ...parties.map((p, idx) => ({
        id: p.partyId || `party-${idx}`,
        label: p.partyName,
        count: p.count,
        sharePct: toShare(p.count),
        color: p.color || FALLBACK_PARTY_COLOR,
      })),
    ];

    const topFive = parties.slice(0, 5);
    const remaining = parties.slice(5);
    const otherCount = remaining.reduce((sum, p) => sum + p.count, 0);

    const donut: PartySegment[] = [
      ...(undecidedTotal > 0
        ? [
          {
            id: 'undecided',
            label: 'Undecided',
            count: undecidedTotal,
            sharePct: toShare(undecidedTotal),
            color: UNDECIDED_COLOR,
          },
        ]
        : []),
      ...topFive.map((p, idx) => ({
        id: p.partyId || `party-${idx}`,
        label: p.partyName,
        count: p.count,
        sharePct: toShare(p.count),
        color: p.color || FALLBACK_PARTY_COLOR,
      })),
      ...(otherCount > 0
        ? [
          {
            id: 'other-parties',
            label: 'Other',
            sublabel: `${remaining.length} ${remaining.length === 1 ? 'party' : 'parties'}`,
            count: otherCount,
            sharePct: toShare(otherCount),
            color: OTHER_GROUP_COLOR,
          },
        ]
        : []),
    ];

    return {
      decidedParties: parties,
      decidedCount: decidedTotal,
      undecidedCount: undecidedTotal,
      decidedPct: knownPct,
      undecidedPct: swingPct,
      barRows: rows,
      donutSegments: donut,
    };
  }, [partyBreakdown, totalVoters]);

  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="chart"
        title="Party support & undecided voters"
        subtitle="See who voters support and how many are still undecided"
        icon={<Vote size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[580px]"
      />
    );
  }

  const isEmptyState = decidedParties.length === 0;
  const maxBarCount = Math.max(...barRows.map((r) => r.count), 1);

  // SVG Donut geometry
  const donutSize = 168;
  const strokeWidth = 22;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const donutTotal = donutSegments.reduce((s, seg) => s + seg.count, 0);
  const gapPx = donutSegments.length > 1 ? 3 : 0;

  let cumulativeOffset = 0;
  const renderedArcs = donutSegments.map((seg) => {
    const ratio = donutTotal > 0 ? seg.count / donutTotal : 0;
    const rawLen = ratio * circumference;
    const dashLen = Math.max(0, rawLen - gapPx);
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += rawLen;
    return { ...seg, dashLen, dashOffset };
  });

  const footerLeftText = isEmptyState
    ? 'Focus on undecided voters to grow your support'
    : viewMode === 'donut' && decidedParties.length > 5
      ? 'Top 5 parties shown, others grouped'
      : `${decidedParties.length} ${decidedParties.length === 1 ? 'party' : 'parties'} + undecided · scroll for all`;

  return (
    <Card
      title="Party support & undecided voters"
      subtitle={
        boothId
          ? 'Showing party support and undecided voters for the selected booth'
          : 'See who voters support and how many are still undecided'
      }
      icon={<Vote size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        <span
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full ${decidedPct > 0
            ? 'bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300'
            : 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300'
            }`}
        >
          < span
            className={`w-[7px] h-[7px] rounded-full ${decidedPct > 0 ? 'bg-[#16A34A]' : 'bg-[#D97706]'
              }`}
          />
          {decidedPct} % party known
        </ span>
      }
      headerClassName="border-[#EEF1F6] dark:border-slate-800/60"
      footerClassName="bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/60"
      footer={
        <CardFooterLink
          hint={footerLeftText}
          label="View voter list"
          to="/dashboard/voters"
        />
      }
      className="flex flex-col justify-between h-full"
    >
      {isEmptyState ? (
        <div className="space-y-4">
          {/* Two tinted summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-[12px]  border-[#F8E2A6] dark:border-amber-800/50 bg-[#FFF8E6] dark:bg-amber-950/20 px-3.5 py-3">
              <p className="text-[12px] font-semibold text-[#92400E] dark:text-amber-300">
                Undecided / swing
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-[26px] leading-[32px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                  {undecidedCount.toLocaleString()}
                </span>
                <span className="text-[13px] text-[#475569] dark:text-slate-400 tabular-nums">
                  {undecidedPct}%
                </span>
              </div>
            </div>

            <div className="rounded-[12px]  border-[#CFF1E2] dark:border-emerald-800/50 bg-[#F0FDF8] dark:bg-emerald-950/20 px-3.5 py-3">
              <p className="text-[12px] font-semibold text-[#065F46] dark:text-emerald-300">
                Party known
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-[26px] leading-[32px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                  0
                </span>
                <span className="text-[13px] text-[#475569] dark:text-slate-400 tabular-nums">
                  0%
                </span>
              </div>
            </div>
          </div>

          {/* Single Undecided Bar */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#64748B] dark:text-slate-400">
              Share of voters
            </p>
            <div className="flex items-center gap-3 min-h-[32px]">
              <span className="w-[128px] flex items-center gap-2 text-[13px] font-semibold text-[#0F172A] dark:text-slate-200 shrink-0">
                <span
                  className="w-[10px] h-[10px] rounded-[3px] shrink-0"
                  style={{ backgroundColor: UNDECIDED_COLOR }}
                />
                Undecided
              </span>
              <div className="flex-1 h-[14px] rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalVoters > 0 ? undecidedPct : 0}%`,
                    backgroundColor: UNDECIDED_COLOR,
                  }}
                />
              </div>
              <div className="w-[110px] text-right text-[13px] tabular-nums shrink-0">
                <strong className="font-semibold text-[#0F172A] dark:text-white">
                  {undecidedCount.toLocaleString()}
                </strong>{' '}
                <span className="text-[#475569] dark:text-slate-400">{undecidedPct}%</span>
              </div>
            </div>
          </div>

          {/* Dashed Empty Callout */}
          <div className="rounded-[12px] border-[1.5px] border-dashed border-[#C7D2FE] dark:border-indigo-800/60 bg-[#F8FAFF] dark:bg-indigo-950/20 p-[10px] pl-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[13px] leading-[18px] text-[#475569] dark:text-slate-300">
              <strong className="font-semibold text-[#312E81] dark:text-indigo-300">
                No parties tagged yet.
              </strong>{' '}
              Each party will appear here as its own bar once volunteers record support in surveys.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/surveys')}
              className="inline-flex items-center justify-center min-h-[40px] px-4 rounded-[10px] bg-[#4338CA] hover:bg-indigo-800 text-white text-[13px] font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              Open surveys
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Metrics + Bars/Donut Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#92400E] dark:text-amber-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: UNDECIDED_COLOR }}
                  />
                  <span>Undecided / swing</span>
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[24px] leading-[30px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                    {undecidedCount.toLocaleString()}
                  </span>
                  <span className="text-[13px] font-medium text-[#475569] dark:text-slate-400 tabular-nums">
                    {undecidedPct}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#065F46] dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>Party known</span>
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[24px] leading-[30px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                    {decidedCount.toLocaleString()}
                  </span>
                  <span className="text-[13px] font-medium text-[#475569] dark:text-slate-400 tabular-nums">
                    {decidedPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bars / Donut Segmented Toggle */}
            <div className="inline-flex items-center rounded-[10px] bg-[#F1F5F9] dark:bg-slate-800 p-1 border border-[#E2E8F0] dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('bars')}
                className={`px-3 py-1 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer ${viewMode === 'bars'
                  ? 'bg-white dark:bg-slate-900 text-[#4338CA] dark:text-indigo-400 shadow-xs'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200'
                  }`}
              >
                Bars
              </button>
              <button
                type="button"
                onClick={() => setViewMode('donut')}
                className={`px-3 py-1 rounded-[7px] text-[12px] font-semibold transition-all cursor-pointer ${viewMode === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-[#4338CA] dark:text-indigo-400 shadow-xs'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200'
                  }`}
              >
                Donut
              </button>
            </div>
          </div>

          {viewMode === 'bars' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] dark:text-slate-400">
                <span>Share of voters</span>
                <span>Voters · Share</span>
              </div>

              <div className="max-h-[225px] overflow-y-auto pr-1.5 space-y-2.5">
                {barRows.map((row) => {
                  const barWidthPct = maxBarCount > 0 ? (row.count / maxBarCount) * 100 : 0;
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[128px_1fr_104px] items-center gap-3 min-h-[26px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-[10px] h-[10px] rounded-[3px] shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span
                          className="text-[13px] font-semibold text-[#0F172A] dark:text-slate-200 truncate"
                          title={row.label}
                        >
                          {row.label}
                        </span>
                      </div>

                      <div className="w-full h-[14px] rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${row.count > 0 ? Math.max(barWidthPct, 2) : 0}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>

                      <div className="flex items-baseline justify-end gap-1.5 text-[13px] tabular-nums">
                        <strong className="font-semibold text-[#0F172A] dark:text-white">
                          {row.count.toLocaleString()}
                        </strong>
                        <span className="text-[12px] text-[#475569] dark:text-slate-400 w-11 text-right">
                          {row.sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-6 py-1">
              {/* SVG Donut Chart */}
              <div className="relative mx-auto" style={{ width: donutSize, height: donutSize }}>
                <svg
                  width={donutSize}
                  height={donutSize}
                  viewBox={`0 0 ${donutSize} ${donutSize}`}
                  className="-rotate-90"
                >
                  <circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-[#F1F5F9] dark:text-slate-800"
                  />
                  {renderedArcs.map((arc) => (
                    <circle
                      key={arc.id}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${arc.dashLen} ${circumference}`}
                      strokeDashoffset={arc.dashOffset}
                      strokeLinecap="butt"
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <span className="text-[24px] font-extrabold text-[#0F172A] dark:text-white tabular-nums leading-none">
                    {decidedPct}%
                  </span>
                  <span className="text-[12px] font-semibold text-[#0F172A] dark:text-slate-200 mt-1">
                    party known
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 tabular-nums mt-0.5">
                    of {totalVoters.toLocaleString()} voters
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-2.5">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-[10px] h-[10px] rounded-[3px] shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span
                        className="font-semibold text-[#0F172A] dark:text-slate-200 truncate"
                        title={seg.label}
                      >
                        {seg.label}
                      </span>
                      {seg.sublabel && (
                        <span className="text-[12px] text-[#64748B] dark:text-slate-400 shrink-0">
                          · {seg.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 tabular-nums shrink-0">
                      <strong className="font-semibold text-[#0F172A] dark:text-white">
                        {seg.count.toLocaleString()}
                      </strong>
                      <span className="text-[12px] text-[#475569] dark:text-slate-400 w-11 text-right">
                        {seg.sharePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
