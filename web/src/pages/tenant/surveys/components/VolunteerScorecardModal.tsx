import React from 'react';
import { Modal } from '@/components/common/Modal';
import { SafeImage } from '@/components/common/SafeImage';
import type { VolunteerSurveyDetailData } from '@/redux/actions/survey';
import {
  Users,
  Phone,
  Vote,
  MapPin,
  ListFilter,
  Flame,
} from 'lucide-react';

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
  if (!isOpen) return null;

  const volunteer = data?.volunteer;
  const summary = data?.summary;
  const fieldCounts = data?.fieldCounts || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={volunteer ? `${volunteer.name}'s Survey Scorecard` : 'Volunteer Survey Scorecard'}
      subtitle="Detailed breakdown of field updates, points awarded, and category performance"
      maxWidth="2xl"
    >
      {loading || !summary ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          Loading volunteer performance metrics...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Volunteer Header Banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <SafeImage
              src={volunteer?.avatar}
              alt={volunteer?.name || 'Volunteer'}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
              fallbackText={volunteer?.name || 'V'}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {volunteer?.name || 'Volunteer'}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  {volunteer?.role || 'Volunteer'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mobile: {volunteer?.mobile || 'N/A'} • Status: {volunteer?.status || 'Active'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Total Score
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {summary.totalScore} <span className="text-xs font-medium">pts</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-center">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Contact Pts</span>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                +{summary.contactPoints}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-center">
              <Vote className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Political Pts</span>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                +{summary.politicalPoints}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-center">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Demographic Pts</span>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                +{summary.demographicPoints}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-center">
              <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Status Pts</span>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                +{summary.statusPoints}
              </p>
            </div>
          </div>

          {/* Aggregate Counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Unique Voters Surveyed
                </span>
              </div>
              <span className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                {summary.votersSurveyed}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Total Fields Enriched
                </span>
              </div>
              <span className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                {summary.fieldsUpdated}
              </span>
            </div>
          </div>

          {/* Breakdown by Field */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" />
              Field-Wise Updates Breakdown
            </h4>

            {Object.keys(fieldCounts).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                No field updates recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {Object.entries(fieldCounts).map(([fieldKey, count]) => (
                  <div
                    key={fieldKey}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {fieldKey.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {count} {count === 1 ? 'update' : 'updates'}
                    </span>
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
