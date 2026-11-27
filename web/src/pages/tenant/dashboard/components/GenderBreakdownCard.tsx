import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooterLink } from '@/components/common/Card';
import { Users, Phone } from 'lucide-react';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface GenderBreakdownCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

const formatShare = (part: number, total: number): string => {
  if (total <= 0 || part <= 0) return '0%';
  const pct = (part / total) * 100;
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
};

export const GenderBreakdownCard: React.FC<GenderBreakdownCardProps> = ({ data, loading }) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="donut"
        skeletonFooter
        title="Voters by gender"
        subtitle="Who your voters are, and how many you can call"
        icon={<Users size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[488px]"
      />
    );
  }

  const { genderBreakdown, genderPhoneReach, totalVoters } = data;
  const male = genderBreakdown?.male || 0;
  const female = genderBreakdown?.female || 0;
  const other = genderBreakdown?.other || 0;

  const malePhone = genderPhoneReach?.maleWithPhone || 0;
  const femalePhone = genderPhoneReach?.femaleWithPhone || 0;
  const otherPhone = genderPhoneReach?.otherWithPhone || 0;

  const totalPhone = malePhone + femalePhone + otherPhone;
  const overallPhonePct = totalVoters > 0 ? Math.round((totalPhone / totalVoters) * 100) : 0;
  const womenPer1000Men = male > 0 ? Math.round((female / male) * 1000) : 0;

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 100) : 0;

  const rows = [
    {
      id: 'female',
      name: 'Women',
      count: female,
      share: formatShare(female, totalVoters),
      phonePct: pct(femalePhone, female),
      color: '#DB2777',
    },
    {
      id: 'male',
      name: 'Men',
      count: male,
      share: formatShare(male, totalVoters),
      phonePct: pct(malePhone, male),
      color: '#2563EB',
    },
    {
      id: 'other',
      name: 'Other',
      count: other,
      share: formatShare(other, totalVoters),
      phonePct: pct(otherPhone, other),
      color: '#7C3AED',
    },
  ];

  // SVG Donut Geometry (radius 100 in 240x240 viewBox)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const denom = totalVoters > 0 ? totalVoters : female + male + other;
  let acc = 0;
  const segments = rows
    .filter((r) => r.count > 0)
    .map((r) => {
      const len = denom > 0 ? (r.count / denom) * circumference : 0;
      const dash = Math.max(len - 3, 1);
      const offset = -acc;
      acc += len;
      return {
        ...r,
        dash,
        gap: circumference - dash,
        offset,
      };
    });

  const hoveredRow = rows.find((r) => r.id === hoveredId);
  const centerBig = hoveredRow ? hoveredRow.share : totalVoters.toLocaleString();
  const centerLabel = hoveredRow ? hoveredRow.name : 'total voters';
  const centerSub = hoveredRow
    ? `${hoveredRow.count.toLocaleString()} voters`
    : 'Hover a row to explore';

  const otherShareText =
    other === 0
      ? '0% of the total'
      : totalVoters > 0 && (other / totalVoters) * 100 < 1
        ? 'less than 1% of the total'
        : `${formatShare(other, totalVoters)} of the total`;

  const phoneSummaryTitle =
    overallPhonePct >= 45 && overallPhonePct <= 55
      ? 'About half of your voters have a phone number saved'
      : `${overallPhonePct}% of your voters have a phone number saved`;

  return (
    <Card
      title="Voters by gender"
      subtitle="Who your voters are, and how many you can call"
      icon={<Users size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full bg-[#FCE7F3] dark:bg-pink-950/50 text-[#9D174D] dark:text-pink-300 whitespace-nowrap">
          <span className="w-[7px] h-[7px] rounded-full bg-[#DB2777] shrink-0" />
          {womenPer1000Men.toLocaleString()} women for every 1,000 men
        </span>
      }
      headerClassName="border-[#EEF1F6] dark:border-slate-800/60"
      footerClassName="bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/60"
      footer={
        <CardFooterLink
          hint={`Other: ${other.toLocaleString()} voters, ${otherShareText}`}
          label="View voter list"
          to="/dashboard/voters"
        />
      }
      className="flex flex-col justify-between h-full"
    >
      <div className="flex flex-col flex-1 justify-between space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[196px_minmax(0,1fr)] gap-7 items-center min-h-[236px]">
          {/* Donut Ring */}
          <div className="relative w-[196px] h-[196px] mx-auto sm:mx-0">
            <svg width="196" height="196" viewBox="0 0 240 240">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="#E8ECF3"
                strokeWidth="22"
                className="dark:stroke-slate-800"
              />
              {segments.map((seg) => {
                const isHovered = hoveredId === seg.id;
                const isDimmed = hoveredId !== null && !isHovered;
                return (
                  <circle
                    key={seg.id}
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    transform="rotate(-90 120 120)"
                    style={{
                      stroke: seg.color,
                      strokeWidth: isHovered ? 26 : 22,
                      strokeDasharray: `${seg.dash.toFixed(2)} ${seg.gap.toFixed(2)}`,
                      strokeDashoffset: seg.offset.toFixed(2),
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'opacity 0.15s, stroke-width 0.15s',
                    }}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-[34px] flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="text-[24px] leading-[30px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                {centerBig}
              </div>
              <div className="text-[12px] font-semibold text-[#334155] dark:text-slate-300">
                {centerLabel}
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 max-w-[100px] tabular-nums">
                {centerSub}
              </div>
            </div>
          </div>

          {/* Interactive Gender Rows */}
          <div>
            {rows.map((row) => {
              const isHovered = hoveredId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(row.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => navigate('/dashboard/voters')}
                  className={`w-full text-left block px-3 py-2.5 rounded-[12px] transition-colors cursor-pointer ${isHovered ? 'bg-[#F1F5FF] dark:bg-indigo-950/30' : 'bg-transparent'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-[10px] h-[10px] rounded-[3px] shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="flex-1 text-[14px] font-semibold text-[#0F172A] dark:text-slate-200">
                      {row.name}
                    </span>
                    <span className="text-[14px] font-bold text-[#0F172A] dark:text-white tabular-nums">
                      {row.count.toLocaleString()}
                    </span>
                    <span className="min-w-[44px] text-right text-[12px] text-[#475569] dark:text-slate-400 tabular-nums">
                      {row.share}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pl-5">
                    <Phone size={14} strokeWidth={2} className="text-[#047857] dark:text-emerald-400 shrink-0" />
                    <span className="flex-1 h-2 rounded-[4px] bg-[#EEF1F6] dark:bg-slate-800 overflow-hidden block">
                      <span
                        className="block h-full rounded-[4px] bg-[#059669] transition-all duration-300"
                        style={{ width: `${row.phonePct}%` }}
                      />
                    </span>
                    <span className="w-[140px] text-right text-[12px] text-[#475569] dark:text-slate-400 tabular-nums">
                      {row.phonePct}% have a phone saved
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Coverage Tip Callout */}
        <div className="flex gap-2.5 items-start px-3.5 py-3 rounded-[12px] bg-[#ECFDF5] dark:bg-emerald-950/20 border-[#A7F3D0] dark:border-emerald-800/50 text-[13px] leading-[19px]">
          <Phone
            size={20}
            strokeWidth={1.8}
            className="text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5"
          />
          <div>
            <div className="font-bold text-[#065F46] dark:text-emerald-300">
              {phoneSummaryTitle}
            </div>
            <div className="text-[#047857] dark:text-emerald-200/90">
              Adding more numbers helps your team reach voters faster.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
