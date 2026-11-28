import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { SafeImage } from '@/components/common/SafeImage';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import type { VolunteerSurveyDetailData } from '@/redux/actions/survey';
import {
  Users,
  Phone,
  Vote,
  MapPin,
  ListFilter,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  pc_leader: 'PC Leader',
  ac_leader: 'AC Leader',
  sub_leader: 'Sub-Leader',
  supporter: 'Volunteer',
  tenant_user: 'Tenant User',
};

interface VolunteerScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VolunteerSurveyDetailData | null;
  loading: boolean;
}

export const VolunteerScorecardModal: React.FC<VolunteerScorecardModalProps> = ({
  isOpen,
  onClose,
  data,
  loading,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'recent'>('breakdown');

  useEffect(() => {
    if (isOpen) setActiveTab('breakdown');
  }, [isOpen]);

  if (!isOpen) return null;

  const volunteer = data?.volunteer;
  const summary = data?.summary;
  const fieldCounts = data?.fieldCounts || {};
  const recentUpdates = data?.recentUpdates || [];
  const sortedFieldEntries = Object.entries(fieldCounts).sort(([, a], [, b]) => b - a);
  const maxFieldCount = sortedFieldEntries.length > 0 ? sortedFieldEntries[0][1] : 1;
  const formattedRole = volunteer?.role
    ? ROLE_LABELS[volunteer.role] || volunteer.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'Volunteer';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={volunteer ? `${volunteer.name}'s Survey Scorecard` : 'Volunteer Survey Scorecard'}
      subtitle="Detailed breakdown of field updates, points awarded, and category performance"
      maxWidth="4xl"
    >
      {loading || !summary ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          Loading volunteer performance metrics...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Unified Volunteer Profile + Total Score Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800/70 dark:to-indigo-950/30 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <SafeImage
                src={volunteer?.avatar}
                alt={volunteer?.name || 'Volunteer'}
                className="w-12 h-12 rounded-xl object-cover border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0"
                fallbackText={volunteer?.name || 'V'}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {volunteer?.name || 'Volunteer'}
                  </h3>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                    {formattedRole}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="font-mono">{volunteer?.mobile ? formatPhoneNumber(volunteer.mobile) : 'N/A'}</span>
                  <span>•</span>
                  <span><strong className="text-slate-700 dark:text-slate-200 font-mono">{summary.votersSurveyed}</strong> voters surveyed</span>
                  <span>•</span>
                  <span><strong className="text-slate-700 dark:text-slate-200 font-mono">{summary.fieldsUpdated}</strong> fields enriched</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200/70 dark:border-slate-700/70">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Total Score
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono leading-tight">
                {summary.totalScore} <span className="text-xs font-semibold">pts</span>
              </span>
            </div>
          </div>

          {/* Compact 4-Category Score Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Contact', pts: summary.contactPoints, icon: Phone, activeCls: 'text-emerald-600 dark:text-emerald-400', bgCls: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/60' },
              { label: 'Political', pts: summary.politicalPoints, icon: Vote, activeCls: 'text-amber-600 dark:text-amber-400', bgCls: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/60' },
              { label: 'Demographic', pts: summary.demographicPoints, icon: Users, activeCls: 'text-indigo-600 dark:text-indigo-400', bgCls: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/60' },
              { label: 'Status', pts: summary.statusPoints, icon: MapPin, activeCls: 'text-rose-600 dark:text-rose-400', bgCls: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/60' },
            ].map((cat) => {
              const Icon = cat.icon;
              const isNonZero = cat.pts > 0;
              return (
                <div
                  key={cat.label}
                  className={`px-3 py-2.5 rounded-lg border flex items-center justify-between ${isNonZero
                    ? cat.bgCls
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isNonZero ? cat.activeCls : 'text-slate-400'}`} />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {cat.label}
                    </span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${isNonZero ? cat.activeCls : 'text-slate-400 dark:text-slate-500'}`}>
                    {isNonZero ? `+${cat.pts}` : '0'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Segmented Tabs to prevent stacked scrollboxes when there are many updates */}
          <div className="space-y-3">
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setActiveTab('breakdown')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === 'breakdown'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Field Breakdown
                <span className="ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {sortedFieldEntries.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recent')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === 'recent'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                Recent Updates
                <span className="ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {recentUpdates.length}
                </span>
              </button>
            </div>

            {activeTab === 'breakdown' ? (
              sortedFieldEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  No field updates recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-90 overflow-y-auto pr-1">
                  {sortedFieldEntries.map(([fieldKey, count]) => {
                    const pct = Math.max(8, Math.round((count / maxFieldCount) * 100));
                    return (
                      <div
                        key={fieldKey}
                        className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">
                            {fieldKey.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {count} {count === 1 ? 'update' : 'updates'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : recentUpdates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                No recent updates recorded.
              </div>
            ) : (
              <div className="space-y-3 max-h-90 overflow-y-auto pr-1">
                {Object.values(
                  recentUpdates.reduce((groups: Record<string, { voterId: string; voterName: string; voterEpicNo: string; totalPts: number; latestAt: string; items: typeof recentUpdates }>, item) => {
                    if (!groups[item.voterId]) {
                      groups[item.voterId] = {
                        voterId: item.voterId,
                        voterName: item.voterName,
                        voterEpicNo: item.voterEpicNo,
                        totalPts: 0,
                        latestAt: item.createdAt,
                        items: [],
                      };
                    }
                    groups[item.voterId].totalPts += item.pointsAwarded;
                    groups[item.voterId].items.push(item);
                    return groups;
                  }, {})
                ).map((group) => (
                  <div
                    key={group.voterId}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    {/* Grouped Voter Header */}
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/dashboard/voters/${group.voterId}`);
                          }}
                          className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 truncate cursor-pointer"
                        >
                          {group.voterName}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                        {group.voterEpicNo && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-500">
                            {group.voterEpicNo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(group.latestAt).toLocaleDateString()}
                        </span>
                        <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                          +{group.totalPts} pts
                        </span>
                      </div>
                    </div>

                    {/* Field Updates for this Voter */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2 text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="font-medium text-slate-600 dark:text-slate-300 min-w-[95px]">
                              {item.fieldLabel}
                            </span>
                            <span className="text-slate-400 truncate max-w-[140px]">
                              {item.oldValue || 'Empty'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                              {item.newValue || 'Cleared'}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                            +{item.pointsAwarded} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
