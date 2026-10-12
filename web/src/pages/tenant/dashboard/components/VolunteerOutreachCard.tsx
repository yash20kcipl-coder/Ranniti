import {
  PhoneCall,
  MessageSquare,
  Smartphone,
  Users,
  Search,
  RefreshCw,
  Trophy,
  Activity,
  Sparkles,
  Shield,
  Award,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { CountUp } from '@/components/common/CountUp';
import { SafeImage } from '@/components/common/SafeImage';
import { FormInput } from '@/components/common/FormInput';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import type { VolunteerLeaderboardItem } from '@/redux/reducers/volunteer';

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pc_leader: { label: 'PC Leader', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Shield },
  ac_leader: { label: 'AC Leader', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Award },
  sub_leader: { label: 'Ward Coordinator', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Users },
  supporter: { label: 'Volunteer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: UserCheck },
};

export interface VolunteerOutreachCardProps {
  volunteerAnalytics?: (filters?: { timeRange?: '7d' | '30d' | 'all'; role?: string }) => void;
}

export const VolunteerOutreachCard: React.FC<VolunteerOutreachCardProps> = ({ volunteerAnalytics }) => {
  const { analytics, analyticsLoading } = useAppSelector((state) => state.volunteer);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'touches' | 'syncs' | 'calls' | 'whatsapp'>('touches');

  // Debounced fetch on filter changes per Rule 13
  useDebouncedEffect(() => {
    if (volunteerAnalytics) {
      volunteerAnalytics({ timeRange, role: roleFilter === 'all' ? undefined : roleFilter });
    }
  }, 200, [volunteerAnalytics, timeRange, roleFilter]);

  const handleRefresh = () => {
    if (volunteerAnalytics) {
      volunteerAnalytics({ timeRange, role: roleFilter === 'all' ? undefined : roleFilter });
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

  const roleBreakdown = analytics?.roleBreakdown || [];
  const rawLeaderboard: VolunteerLeaderboardItem[] = analytics?.leaderboard || [];

  // Filter leaderboard by search term & sort
  const filteredLeaderboard = rawLeaderboard
    .filter((item) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.mobile && item.mobile.includes(q)) ||
        item.roleName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'syncs') return b.contactsSynced - a.contactsSynced;
      if (sortBy === 'calls') return b.callsCount - a.callsCount;
      if (sortBy === 'whatsapp') return b.whatsAppCount - a.whatsAppCount;
      return b.totalTouches - a.totalTouches;
    });

  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 space-y-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Volunteer Outreach & Performance Analytics
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                <Sparkles className="w-3 h-3" /> Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Field worker activity on voter phonebook syncs, direct phone dials, and WhatsApp campaigns
            </p>
          </div>
        </div>

        {/* Range Tabs & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
      </div>

      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Contacts Synced */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50/70 via-white to-purple-50/30 dark:from-violet-950/20 dark:via-slate-900 dark:to-purple-950/10 border border-violet-200/80 dark:border-violet-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Contacts Synced
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              <CountUp to={kpis.totalContactsSynced} duration={1} />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Phonebook → Voter Roll</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Calls Initiated */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-cyan-950/10 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Calls Initiated
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              <CountUp to={kpis.totalCallsInitiated} duration={1} />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Direct Phone Dial Actions</span>
            </p>
          </div>
        </div>

        {/* KPI 3: WhatsApp Touches */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              WhatsApp Touches
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              <CountUp to={kpis.totalWhatsAppSent} duration={1} />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Template Messages Sent</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Active Volunteers & Total Touches */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/10 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Total Voter Touches
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              <CountUp to={kpis.totalVoterTouches} duration={1} />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>{kpis.activeVolunteersCount} of {kpis.totalVolunteersCount} Cadres Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Cadre Outreach by Volunteer Role */}
      {roleBreakdown.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Outreach Breakdown by Volunteer Role
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Contribution by Cadre Tier
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roleBreakdown.map((item) => {
              const cfg = ROLE_BADGES[item.role] || {
                label: item.roleName,
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: Users,
              };
              const RoleIcon = cfg.icon;
              const totalTouches = item.totalTouches || 1;
              const syncPct = Math.round((item.contactsSynced / totalTouches) * 100);
              const callsPct = Math.round((item.callsInitiated / totalTouches) * 100);
              const waPct = Math.round((item.whatsAppSent / totalTouches) * 100);

              return (
                <div
                  key={item.role}
                  className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color}`}>
                      <RoleIcon size={11} />
                      {item.roleName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {item.volunteerCount} workers
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Touches:</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {item.totalTouches.toLocaleString()}
                    </span>
                  </div>

                  {/* Channel Breakdown Mini Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${syncPct}%` }} className="bg-violet-500" title={`Synced: ${item.contactsSynced}`} />
                      <div style={{ width: `${callsPct}%` }} className="bg-blue-500" title={`Calls: ${item.callsInitiated}`} />
                      <div style={{ width: `${waPct}%` }} className="bg-emerald-500" title={`WhatsApp: ${item.whatsAppSent}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="text-violet-600 dark:text-violet-400">{item.contactsSynced} Sync</span>
                      <span className="text-blue-600 dark:text-blue-400">{item.callsInitiated} Call</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{item.whatsAppSent} WA</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Section: Volunteer Outreach Leaderboard Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Ground Worker Outreach Leaderboard
            </h4>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredLeaderboard.length} Volunteers
            </span>
          </div>

          {/* Filter & Sort Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48 sm:w-56">
              <FormInput
                type="text"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search volunteer..."
                className="text-xs"
                icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>

            <div className="w-36">
              <FormInput
                type="select"
                name="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'pc_leader', label: 'PC Leader' },
                  { value: 'ac_leader', label: 'AC Leader' },
                  { value: 'sub_leader', label: 'Ward Coordinator' },
                  { value: 'supporter', label: 'Volunteer' },
                ]}
                className="text-xs"
              />
            </div>

            <div className="w-36">
              <FormInput
                type="select"
                name="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'touches', label: 'Sort: Total Touches' },
                  { value: 'syncs', label: 'Sort: Contacts Synced' },
                  { value: 'calls', label: 'Sort: Calls' },
                  { value: 'whatsapp', label: 'Sort: WhatsApp' },
                ]}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-2.5 pl-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-3">Volunteer / Cadre</th>
                <th className="py-2.5 px-3">Role Tier</th>
                <th className="py-2.5 px-3 text-center">Assigned Booths</th>
                <th className="py-2.5 px-3 text-right">Contacts Synced</th>
                <th className="py-2.5 px-3 text-right">Calls Made</th>
                <th className="py-2.5 px-3 text-right">WhatsApp Sent</th>
                <th className="py-2.5 pr-4 text-right">Total Touches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {analyticsLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Loading outreach telemetry...</span>
                      </div>
                    ) : (
                      <span>No volunteer outreach telemetry recorded for this filter.</span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  const cfg = ROLE_BADGES[item.role] || {
                    label: item.roleName,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: Users,
                  };
                  const RoleIcon = cfg.icon;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-3 pl-3 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-[11px] shadow-2xs">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-extrabold text-[11px]">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-extrabold text-[11px]">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 font-semibold text-[11px]">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Volunteer Name & Mobile */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <SafeImage
                            src={item.avatar}
                            alt={item.name}
                            fallbackText={item.name}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                            containerClassName="w-8 h-8 rounded-full shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {item.mobile || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Tier */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color}`}>
                          <RoleIcon size={11} />
                          {item.roleName}
                        </span>
                      </td>

                      {/* Assigned Booths */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {item.assignedBoothsCount > 0 ? `${item.assignedBoothsCount} Booths` : '—'}
                        </span>
                      </td>

                      {/* Contacts Synced */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-200/60 dark:border-violet-800/60">
                          <Smartphone size={11} />
                          {item.contactsSynced.toLocaleString()}
                        </span>
                      </td>

                      {/* Calls Made */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60">
                          <PhoneCall size={11} />
                          {item.callsCount.toLocaleString()}
                        </span>
                      </td>

                      {/* WhatsApp Sent */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60">
                          <MessageSquare size={11} />
                          {item.whatsAppCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Total Touches */}
                      <td className="py-3 pr-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            {item.totalTouches.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.engagementScore}% score
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VolunteerOutreachCard;
