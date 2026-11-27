import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { Card, CardFooterLink } from '@/components/common/Card';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface CadreDeploymentCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  pc_leader: 'PC Leader',
  ac_leader: 'AC Leader',
  leader: 'Leader',
  sub_leader: 'Booth Sub-Leader',
  supporter: 'Supporter',
};

export const CadreDeploymentCard: React.FC<CadreDeploymentCardProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="stats"
        title="Booth team"
        subtitle="Your sub-leaders and supporters at every polling booth"
        icon={<Users size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[620px]"
      />
    );
  }

  const summary = data.cadreSummary || {
    subLeaderCount: 0,
    supporterCount: 0,
    fullyStaffedBooths: 0,
    partiallyStaffedBooths: 0,
    unstaffedBooths: 0,
    totalBooths: data.totalBooths || 0,
  };

  const isSingleBooth = Boolean(data.boothId);
  const teamMembers = summary.boothTeamMembers || [];
  const totalMembers = summary.subLeaderCount + summary.supporterCount;
  const totalBooths = summary.totalBooths || data.totalBooths || 0;

  const denom = totalBooths > 0 ? totalBooths : 1;
  const readyPct = totalBooths > 0 ? (summary.fullyStaffedBooths / denom) * 100 : 0;
  const partialPct = totalBooths > 0 ? (summary.partiallyStaffedBooths / denom) * 100 : 0;
  const unstaffedPct = totalBooths > 0 ? (summary.unstaffedBooths / denom) * 100 : 0;

  return (
    <Card
      title="Booth team"
      subtitle="Your sub-leaders and supporters at every polling booth"
      icon={<Users size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        <span
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full ${totalMembers > 0
            ? 'bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 border border-transparent dark:border-emerald-800/40'
            : 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-transparent dark:border-amber-800/40'
            }`}
        >
          <span
            className={`w-[7px] h-[7px] rounded-full shrink-0 ${totalMembers > 0 ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
              }`}
          />
          {totalMembers.toLocaleString()} team members
        </span>
      }
      headerClassName="border-[#EEF1F6] dark:border-slate-800/80"
      footerClassName="bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/80"
      footer={
        <CardFooterLink
          hint="Every booth should have at least 1 sub-leader and 1 supporter"
          label="Manage team"
          to="/dashboard/volunteers"
        />
      }
      className="flex flex-col justify-between h-full min-h-[620px]"
    >
      <div className="flex flex-col h-full justify-between gap-4">
        {/* Top 2 Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#FFFBEB] dark:bg-amber-950/30 dark:border-amber-800/50">
            <div className="text-[13px] font-semibold text-[#92400E] dark:text-amber-300">
              Booth sub-leaders
            </div>
            <div className="text-[34px] leading-[44px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
              {summary.subLeaderCount.toLocaleString()}
            </div>
            <div className="text-[13px] text-[#475569] dark:text-slate-400">
              Lead and manage the work at a booth
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#ECFDF5] dark:bg-emerald-950/30 dark:border-emerald-800/50">
            <div className="text-[13px] font-semibold text-[#065F46] dark:text-emerald-300">
              Supporters
            </div>
            <div className="text-[34px] leading-[44px] font-extrabold text-[#0F172A] dark:text-white tabular-nums">
              {summary.supporterCount.toLocaleString()}
            </div>
            <div className="text-[13px] text-[#475569] dark:text-slate-400">
              Help with door-to-door visits
            </div>
          </div>
        </div>

        {isSingleBooth ? (
          /* Single Booth View */
          <div className="space-y-3 pt-1">
            <div className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 tracking-[0.04em] uppercase">
              Assigned Team for Selected Booth
            </div>
            {teamMembers.length === 0 ? (
              <div className="rounded-[14px] border-dashed border-[#FECDD3] dark:border-rose-900/50 bg-[#FFF1F2] dark:bg-rose-950/20 p-5 text-center">
                <AlertCircle size={26} className="text-[#BE123C] mx-auto mb-2" />
                <p className="text-[14px] font-bold text-[#881337] dark:text-rose-200">
                  No Sub-Leader or Supporter assigned to this booth yet
                </p>
                <p className="text-[12.5px] text-[#9F1239] dark:text-rose-300/80 mt-0.5">
                  Assign a team member so this booth is covered on voting day.
                </p>
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-[12px] border-[#E3E8F0] dark:border-slate-800 bg-[#FAFBFD] dark:bg-slate-800/50 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="text-[13.5px] font-bold text-[#0F172A] dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-[12px] text-[#475569] dark:text-slate-400">
                        {ROLE_LABELS[member.role] || member.role}
                      </p>
                    </div>
                    {member.phone && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[12px] text-[#0F172A] dark:text-slate-200 tabular-nums bg-white dark:bg-slate-700/80 px-2.5 py-1 rounded-md  border-[#E3E8F0] dark:border-slate-600">
                        <Phone size={12} className="text-[#16A34A]" />
                        {member.phone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Multi-booth Overview */
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-baseline justify-between mt-1 text-[11px] font-semibold text-[#64748B] dark:text-slate-400 tracking-[0.04em] uppercase">
              <span>Booth team readiness</span>
              <span className="tabular-nums">{totalBooths.toLocaleString()} booths in total</span>
            </div>

            {/* Segmented bar */}
            <div
              role="img"
              aria-label={`Booth readiness: ${summary.fullyStaffedBooths} ready, ${summary.partiallyStaffedBooths} partial, ${summary.unstaffedBooths} unstaffed`}
              className="flex h-3 rounded-[6px] overflow-hidden bg-[#E8ECF3] dark:bg-slate-700/80"
            >
              {readyPct > 0 && (
                <span
                  style={{ width: `${readyPct}%` }}
                  className="bg-[#16A34A] dark:bg-emerald-500 transition-all duration-500"
                  title={`Ready: ${summary.fullyStaffedBooths} booths (${readyPct.toFixed(1)}%)`}
                />
              )}
              {partialPct > 0 && (
                <span
                  style={{ width: `${partialPct}%` }}
                  className="bg-[#F59E0B] dark:bg-amber-500 transition-all duration-500"
                  title={`Needs more help: ${summary.partiallyStaffedBooths} booths (${partialPct.toFixed(1)}%)`}
                />
              )}
              {unstaffedPct > 0 && (
                <span
                  style={{ width: `${unstaffedPct}%` }}
                  className="bg-[#E11D48] dark:bg-rose-500 transition-all duration-500"
                  title={`No team yet: ${summary.unstaffedBooths} booths (${unstaffedPct.toFixed(1)}%)`}
                />
              )}
            </div>

            {/* 3 Readiness Cards */}
            <div className="flex items-center gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-[12px] bg-[#ECFDF5] dark:bg-emerald-950/30 border-transparent dark:border-emerald-900/40 mt-1">
              <CheckCircle2 size={22} className="text-[#047857] dark:text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-[#065F46] dark:text-emerald-200">
                  Ready
                </div>
                <div className="text-[12px] text-[#475569] dark:text-slate-400">
                  Has a sub-leader and supporters
                </div>
              </div>
              <div className="text-[14px] font-bold text-[#065F46] dark:text-emerald-300 tabular-nums">
                {summary.fullyStaffedBooths.toLocaleString()}{' '}
                <span className="font-medium text-[12px]">booths</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-[12px] bg-[#FFFBEB] dark:bg-amber-950/30  border-transparent dark:border-amber-900/40">
              <AlertTriangle size={22} className="text-[#B45309] dark:text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-[#92400E] dark:text-amber-200">
                  Needs more help
                </div>
                <div className="text-[12px] text-[#475569] dark:text-slate-400">
                  Only one role is filled
                </div>
              </div>
              <div className="text-[14px] font-bold text-[#92400E] dark:text-amber-300 tabular-nums">
                {summary.partiallyStaffedBooths.toLocaleString()}{' '}
                <span className="font-medium text-[12px]">booths</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-[12px] bg-[#FFF1F2] dark:bg-rose-950/30 border-transparent dark:border-rose-900/40">
              <AlertCircle size={22} className="text-[#BE123C] dark:text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-[#9F1239] dark:text-rose-200">
                  No team yet
                </div>
                <div className="text-[12px] text-[#475569] dark:text-slate-400">
                  No sub-leader or supporter
                </div>
              </div>
              <div className="text-[14px] font-bold text-[#9F1239] dark:text-rose-300 tabular-nums">
                {summary.unstaffedBooths.toLocaleString()}{' '}
                <span className="font-medium text-[12px]">booths</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tip Box */}
        {summary.unstaffedBooths > 0 ? (
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-[12px] bg-[#FFF1F2] dark:bg-rose-950/30  border-[#FECDD3] dark:border-rose-900/50 text-[13px] leading-[19px] mt-auto">
            <AlertCircle size={20} className="text-[#BE123C] dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#881337] dark:text-rose-200">
                {summary.unstaffedBooths === totalBooths ? `All ${summary.unstaffedBooths}` : summary.unstaffedBooths}{' '}
                booths still need a team
              </div>
              <div className="text-[#9F1239] dark:text-rose-300/90 text-[12.5px] mt-0.5">
                Start by adding one sub-leader to each booth, then add supporters.
              </div>
            </div>
          </div>
        ) : summary.partiallyStaffedBooths > 0 ? (
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-[12px] bg-[#FFFBEB] dark:bg-amber-950/30  border-[#FDE68A] dark:border-amber-800/50 text-[13px] leading-[19px] mt-auto">
            <AlertTriangle size={20} className="text-[#B45309] dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#78350F] dark:text-amber-200">
                {summary.partiallyStaffedBooths} booths need more help
              </div>
              <div className="text-[#92400E] dark:text-amber-300/90 text-[12.5px] mt-0.5">
                Add supporters or sub-leaders so both roles are covered at every booth.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-[12px] bg-[#ECFDF5] dark:bg-emerald-950/30  border-[#A7F3D0] dark:border-emerald-800/50 text-[13px] leading-[19px] mt-auto">
            <CheckCircle2 size={20} className="text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#065F46] dark:text-emerald-200">
                All booths are fully staffed!
              </div>
              <div className="text-[#166534] dark:text-emerald-300/90 text-[12.5px] mt-0.5">
                Great job! Every booth has active sub-leaders and supporters deployed.
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
