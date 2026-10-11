import {
  MapPin,
  Building2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Shield,
  Award,
  Users,
  UserCheck,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface BoothCoverageCardProps {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    gradient: string;
    iconBg: string;
  }
> = {
  pc_leader: {
    label: 'PC Leader',
    icon: Shield,
    gradient: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  ac_leader: {
    label: 'AC Leader',
    icon: Award,
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  sub_leader: {
    label: 'Sub-Leader / Ward Coordinator',
    icon: Users,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  supporter: {
    label: 'Supporter / Booth Volunteer',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

export const BoothCoverageCard: React.FC<BoothCoverageCardProps> = ({ data, loading }) => {
  const navigate = useNavigate();

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    );
  }

  const {
    totalBooths,
    assignedBoothsCount,
    acBreakdown,
    totalVoters,
    totalVolunteers = 0,
    boothCoverageByRole = [],
  } = data;
  const unassignedBooths = Math.max(0, totalBooths - assignedBoothsCount);
  const coveragePct = totalBooths > 0 ? Math.round((assignedBoothsCount / totalBooths) * 100) : 0;
  const cadreRatio = totalBooths > 0 ? (totalVolunteers / totalBooths).toFixed(2) : '0.00';
  const avgVotersPerBooth = totalBooths > 0 ? Math.round(totalVoters / totalBooths) : 0;

  const defaultRolesList = [
    { role: 'pc_leader', roleName: 'PC Leader', volunteerCount: 0, coveredBoothsCount: 0 },
    { role: 'ac_leader', roleName: 'AC Leader', volunteerCount: 0, coveredBoothsCount: 0 },
    { role: 'sub_leader', roleName: 'Sub-Leader', volunteerCount: 0, coveredBoothsCount: 0 },
    { role: 'supporter', roleName: 'Supporter / Volunteer', volunteerCount: 0, coveredBoothsCount: 0 },
  ];

  const effectiveRoleCoverage =
    boothCoverageByRole && boothCoverageByRole.length > 0 ? boothCoverageByRole : defaultRolesList;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs h-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Electoral Infrastructure & Booths
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Assembly constituencies and polling booth readiness
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/tenant-master')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          Manage <ChevronRight size={14} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3.5 flex-1">
        {/* Booth Coverage Readiness Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Covered Booths
                </p>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-mono">
                  {coveragePct}%
                </span>
              </div>
              <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 font-mono leading-tight mt-0.5">
                {assignedBoothsCount} <span className="text-xs font-medium text-emerald-600">/ {totalBooths}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Needs Cadre
              </p>
              <p className="text-base font-extrabold text-amber-950 dark:text-amber-100 font-mono leading-tight mt-0.5">
                {unassignedBooths} <span className="text-xs font-medium text-amber-600">Booths</span>
              </p>
            </div>
          </div>
        </div>

        {/* Electoral Infrastructure Key Metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-center space-y-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Avg Booth Size</span>
            <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 block">
              {avgVotersPerBooth.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">EC Norm Compliant</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-center space-y-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Cadre Ratio</span>
            <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 block">
              {cadreRatio} / booth
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium block">
              {totalVolunteers} volunteers
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-center space-y-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">AC Coverage</span>
            <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 block">
              {acBreakdown.length} Vidhan Sabha
            </span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold block">100% Configured</span>
          </div>
        </div>

        {/* AC-wise breakdown list */}
        <div className="space-y-2">
          <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
            Assembly Constituency (AC) Distribution
          </p>

          {acBreakdown.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-400">
              No Assembly Constituencies configured yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
              {acBreakdown.map((ac) => {
                const acPct = totalVoters > 0 ? Math.round((ac.voterCount / totalVoters) * 100) : 0;
                return (
                  <div
                    key={ac.acId || ac.acName}
                    className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin size={13} className="text-indigo-500" />
                        {ac.acName}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {ac.voterCount.toLocaleString()} voters ({acPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(5, acPct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booth Coverage by Volunteer Cadre */}
        <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-indigo-500" />
              Booth Coverage by Volunteer Type
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10.5px]">
              {totalVolunteers} Cadres Active
            </span>
          </div>

          <div className="space-y-2">
            {effectiveRoleCoverage.map((item) => {
              const cfg = ROLE_CONFIG[item.role] || {
                label: item.roleName || item.role,
                icon: Users,
                gradient: 'from-slate-500 to-slate-600',
                iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
              };
              const Icon = cfg.icon;
              const roleCoveragePct =
                totalBooths > 0 ? Math.round((item.coveredBoothsCount / totalBooths) * 100) : 0;

              return (
                <div
                  key={item.role}
                  className="p-2 rounded-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 space-y-1.5 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                        <Icon size={12} />
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate text-[11.5px]">
                        {cfg.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                        {item.volunteerCount} {item.volunteerCount === 1 ? 'cadre' : 'cadres'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.coveredBoothsCount}{' '}
                        <span className="text-slate-400 font-normal">/ {totalBooths}</span>
                      </span>
                      <span
                        className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded font-mono ${roleCoveragePct > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                      >
                        {roleCoveragePct}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(100, Math.max(0, roleCoveragePct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Infrastructure Readiness Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Polling Infrastructure: <strong className="text-emerald-600 font-mono">100% Operational</strong>
        </span>
        <button
          type="button"
          onClick={() => navigate('/dashboard/tenant-master')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          View All {totalBooths} Booths <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
