import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchTenantSurveyFieldPoints,
  fetchSuperAdminSurveyFieldPoints,
  updateSuperAdminSurveyFieldPoints,
  resetSuperAdminSurveyFieldPoints,
} from '@/redux/actions/settings';
import type { SurveyFieldPointsConfig, SurveyFieldPointRule } from '@/types/settings.types';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
  Award,
  RotateCcw,
  Save,
  CheckCircle2,
  Phone,
  Vote,
  Users,
  MapPin,
  ShieldCheck,
  Calculator,
  Sparkles,
  Lock,
} from 'lucide-react';

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  contact: {
    label: 'Contact Information',
    icon: <Phone className="w-4 h-4 text-emerald-500" />,
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
  },
  political: {
    label: 'Political & Voter Leaning',
    icon: <Vote className="w-4 h-4 text-amber-500" />,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
  demographic: {
    label: 'Demographics & Community',
    icon: <Users className="w-4 h-4 text-indigo-500" />,
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
  },
  status: {
    label: 'Voter Status & Residence',
    icon: <MapPin className="w-4 h-4 text-rose-500" />,
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
  },
  address: {
    label: 'Address & Residence',
    icon: <MapPin className="w-4 h-4 text-sky-500" />,
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
  },
  identification: {
    label: 'Official Identification',
    icon: <ShieldCheck className="w-4 h-4 text-purple-500" />,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
  },
  profile: {
    label: 'General Profile',
    icon: <Sparkles className="w-4 h-4 text-teal-500" />,
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
  },
};

interface SurveyPointsConfigSectionProps {
  mode?: 'super-admin' | 'tenant';
  readOnly?: boolean;
}

export const SurveyPointsConfigSection: React.FC<SurveyPointsConfigSectionProps> = ({
  mode = 'super-admin',
  readOnly = false,
}) => {
  const dispatch = useAppDispatch();
  const { surveyFieldPoints, surveyPointsLoading, surveyPointsSaving } = useAppSelector(
    (state) => state.settings
  );

  const [formConfig, setFormConfig] = useState<SurveyFieldPointsConfig>({});
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [simulatedFields, setSimulatedFields] = useState<Record<string, boolean>>({
    mobile_no: true,
    party_id: true,
    caste_id: true,
  });

  const isSuperAdminMode = mode === 'super-admin' && !readOnly;

  useEffect(() => {
    if (isSuperAdminMode) {
      dispatch(fetchSuperAdminSurveyFieldPoints());
    } else {
      dispatch(fetchTenantSurveyFieldPoints());
    }
  }, [dispatch, isSuperAdminMode]);

  useEffect(() => {
    if (surveyFieldPoints) {
      setFormConfig(surveyFieldPoints);
    }
  }, [surveyFieldPoints]);

  const handlePointChange = (fieldKey: string, points: number) => {
    if (readOnly) return;
    setFormConfig((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        points: Math.max(0, Math.min(100, isNaN(points) ? 0 : points)),
      },
    }));
  };

  const handleToggleEnabled = (fieldKey: string, enabled: boolean) => {
    if (readOnly) return;
    setFormConfig((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        enabled,
      },
    }));
  };

  const handleToggleRequireEmpty = (fieldKey: string, requirePreviouslyEmpty: boolean) => {
    if (readOnly) return;
    setFormConfig((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        requirePreviouslyEmpty,
      },
    }));
  };

  const handleSave = async () => {
    if (readOnly) return;
    await dispatch(updateSuperAdminSurveyFieldPoints(formConfig));
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  const handleConfirmReset = async () => {
    if (readOnly) return;
    await dispatch(resetSuperAdminSurveyFieldPoints());
    setResetModalOpen(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Group fields by category
  const groupedFields = Object.entries(formConfig).reduce(
    (acc, [fieldKey, rule]) => {
      const cat = rule.category || 'profile';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ fieldKey, rule });
      return acc;
    },
    {} as Record<string, Array<{ fieldKey: string; rule: SurveyFieldPointRule }>>
  );

  // Compute simulation points
  const simulatedScore = Object.entries(simulatedFields).reduce((sum, [fieldKey, isSelected]) => {
    if (!isSelected) return sum;
    const rule = formConfig[fieldKey];
    return rule && rule.enabled ? sum + (rule.points || 0) : sum;
  }, 0);

  const totalMaxPossibleScore = Object.values(formConfig).reduce((sum, rule) => {
    return rule.enabled ? sum + (rule.points || 0) : sum;
  }, 0);

  const enabledCount = Object.values(formConfig).filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Platform Survey Scoring Point Rules
              </h2>
              {readOnly ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Super Admin Controlled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Super Admin Exclusive
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {readOnly
                ? 'These scoring rules are centrally defined by Super Admin and active across all campaign surveys.'
                : 'Define points awarded to ground volunteers across all campaigns when verifying or updating voter records.'}
            </p>
          </div>
        </div>

        {isSuperAdminMode && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={surveyPointsSaving || surveyPointsLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={surveyPointsSaving || surveyPointsLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {surveyPointsSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>

      {saveSuccessNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Master survey field points successfully updated and applied platform-wide!</span>
        </div>
      )}

      {/* Grid: Left Column Field Categories, Right Column Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configurable Categories */}
        <div className="lg:col-span-2 space-y-6">
          {surveyPointsLoading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Loading survey point rules...
            </div>
          ) : (
            Object.entries(groupedFields).map(([category, items]) => {
              const meta = CATEGORY_META[category] || CATEGORY_META.profile;
              return (
                <div
                  key={category}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                >
                  {/* Category Header */}
                  <div className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 ${meta.bgColor}`}>
                    <div className="flex items-center gap-2.5">
                      {meta.icon}
                      <span className={`font-semibold text-sm ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      {items.length} fields
                    </span>
                  </div>

                  {/* Fields Table / Rows */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map(({ fieldKey, rule }) => (
                      <div
                        key={fieldKey}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          !rule.enabled ? 'opacity-50 bg-slate-50/50 dark:bg-slate-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Field Label and Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {rule.label}
                            </span>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {fieldKey}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <label className={`inline-flex items-center gap-1.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={rule.requirePreviouslyEmpty ?? false}
                                onChange={(e) => handleToggleRequireEmpty(fieldKey, e.target.checked)}
                                disabled={readOnly || !rule.enabled}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                              />
                              <span>Reward only if previously blank (anti-farming)</span>
                            </label>
                          </div>
                        </div>

                        {/* Controls: Enable Switch and Points Number Input */}
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Points Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Points:
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={rule.points}
                              disabled={readOnly || !rule.enabled}
                              onChange={(e) => handlePointChange(fieldKey, parseInt(e.target.value, 10))}
                              className="w-16 px-2.5 py-1.5 text-center text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                            />
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              pts
                            </span>
                          </div>

                          {/* Enable/Disable Toggle */}
                          <label className={`relative inline-flex items-center ${readOnly ? 'cursor-default opacity-60' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              disabled={readOnly}
                              onChange={(e) => handleToggleEnabled(fieldKey, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Points Simulator & Campaign Summary */}
        <div className="space-y-6">
          {/* Summary Metric Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              Scoring Summary
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Enabled Fields</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {enabledCount} <span className="text-xs font-normal text-slate-400">/ {Object.keys(formConfig).length}</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Max Profile Score</span>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {totalMaxPossibleScore} <span className="text-xs font-normal">pts</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              These point weights are managed exclusively by Super Admin. Ground volunteers earn points dynamically as they verify or update voter records.
            </p>
          </div>

          {/* Interactive Calculator / Simulator */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                Live Survey Simulator
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono font-medium">
                Simulated Score
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md text-center">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                Estimated Volunteer Reward
              </span>
              <div className="text-3xl font-extrabold mt-1">
                +{simulatedScore} <span className="text-base font-normal">Points</span>
              </div>
              <p className="text-xs opacity-80 mt-1">
                Based on currently selected simulated field updates
              </p>
            </div>

            {/* Simulation Checkbox List */}
            <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
              {Object.entries(formConfig).map(([fieldKey, rule]) => (
                <label
                  key={fieldKey}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                    simulatedFields[fieldKey]
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(simulatedFields[fieldKey])}
                      onChange={(e) =>
                        setSimulatedFields((prev) => ({
                          ...prev,
                          [fieldKey]: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{rule.label}</span>
                  </div>
                  <span className="font-semibold font-mono">
                    {rule.enabled ? `+${rule.points} pts` : 'Disabled'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting to Defaults (Rule 10/24) */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Survey Point Weights?"
        description="Are you sure you want to reset all field point values back to system election defaults? Any custom point weights configured will be overwritten platform-wide."
        confirmText="Reset to Defaults"
        confirmVariant="warning"
      />
    </div>
  );
};

export default SurveyPointsConfigSection;
