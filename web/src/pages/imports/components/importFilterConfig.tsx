import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Vote,
  Home,
  Building,
  Building2,
  Layers,
  Map,
  Landmark,
  Users,
  Briefcase,
  Award,
  HeartHandshake,
  Flag,
  CalendarCheck,
} from 'lucide-react';
import type { Column } from '@/components/common/DataTable';
import type { FilterField, FilterPreset, Option } from '@/components/common/FilterBar';
import type { ImportJob } from '@/redux/actions/importJobs';

export interface CategoryMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badgeBg: string;
  scopeGroup: 'voters' | 'geography' | 'demographics' | 'political';
  superAdminOnly?: boolean;
}

export const ALL_IMPORT_CATEGORIES: CategoryMeta[] = [
  {
    key: 'voters',
    label: 'Voter Directory',
    description: 'Bulk import voter registration records with EPIC number and household mapping',
    icon: Vote,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
    scopeGroup: 'voters',
  },
  {
    key: 'booths',
    label: 'Polling Booths',
    description: 'Polling stations with booth numbers, locations, and voter counts',
    icon: Vote,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'wards',
    label: 'Wards (Prabhags)',
    description: 'Municipal wards and ward numbers under assembly constituencies',
    icon: Layers,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'villages',
    label: 'Villages (Gaon)',
    description: 'Rural villages and hamlets mapped under sub-districts/talukas',
    icon: Home,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'talukas',
    label: 'Talukas (Tehsils)',
    description: 'Tehsil and sub-district administrative divisions',
    icon: Building,
    color: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'acs',
    label: 'Assembly Constituencies (AC)',
    description: 'State assembly legislative constituency segments',
    icon: Building2,
    color: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'pcs',
    label: 'Parliamentary Constituencies (PC)',
    description: 'Lok Sabha parliamentary constituency boundaries',
    icon: Landmark,
    color: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'districts',
    label: 'Districts',
    description: 'State administrative district jurisdictions',
    icon: Map,
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    scopeGroup: 'geography',
  },
  {
    key: 'castes',
    label: 'Castes & Subcastes',
    description: 'Caste demographics, categories and reservations',
    icon: Users,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    scopeGroup: 'demographics',
  },
  {
    key: 'religions',
    label: 'Religions',
    description: 'Religious community classifications',
    icon: HeartHandshake,
    color: 'text-pink-600 dark:text-pink-400',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60',
    scopeGroup: 'demographics',
  },
  {
    key: 'profession-categories',
    label: 'Profession Categories',
    description: 'High-level occupational sectors and industries',
    icon: Briefcase,
    color: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    scopeGroup: 'demographics',
  },
  {
    key: 'professions',
    label: 'Specific Professions',
    description: 'Detailed job profiles and specialized voter occupations',
    icon: Award,
    color: 'text-yellow-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/60',
    scopeGroup: 'demographics',
  },
  {
    key: 'parties',
    label: 'Political Parties',
    description: 'Political organizations, symbols and party abbreviations',
    icon: Flag,
    color: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
    scopeGroup: 'political',
    superAdminOnly: true,
  },
  {
    key: 'elections',
    label: 'Elections',
    description: 'Election terms, voting dates, and polling status records',
    icon: CalendarCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    scopeGroup: 'political',
    superAdminOnly: true,
  },
];

export interface ImportFilterState {
  category: string;
  status: string;
  setFilter: (key: string, val: string) => void;
}

export function buildImportFilterPresets(filterState: ImportFilterState): FilterPreset[] {
  const { status, setFilter } = filterState;

  return [
    {
      label: 'All Jobs',
      active: status === 'all' || !status,
      apply: () => setFilter('status', 'all'),
    },
    {
      label: 'In Progress',
      active: status === 'processing',
      apply: () => setFilter('status', 'processing'),
    },
    {
      label: '100% Clean',
      active: status === 'completed',
      apply: () => setFilter('status', 'completed'),
    },
    {
      label: 'With Warnings',
      active: status === 'warnings',
      apply: () => setFilter('status', 'warnings'),
    },
    {
      label: 'Failed Only',
      active: status === 'failed',
      apply: () => setFilter('status', 'failed'),
    },
  ];
}

export function buildImportFilterFields(
  filterState: ImportFilterState,
  authorizedCategories: CategoryMeta[]
): FilterField[] {
  const { category, status, setFilter } = filterState;

  const categoryOptions: Option[] = [
    { label: 'All Categories', value: 'all' },
    ...authorizedCategories.map((c) => ({
      label: c.label,
      value: c.key,
    })),
  ];

  const statusOptions: Option[] = [
    { label: 'All Statuses', value: 'all' },
    { label: 'In Progress / Pending', value: 'processing' },
    { label: '100% Succeeded', value: 'completed' },
    { label: 'With Warnings / Partial', value: 'warnings' },
    { label: 'Failed Only', value: 'failed' },
  ];

  return [
    {
      key: 'category',
      label: 'Import Category',
      type: 'select',
      value: category,
      defaultValue: 'all',
      excludeFromCount: true,
      onChange: (val) => setFilter('category', val),
      options: categoryOptions,
      isPrimary: true,
      category: 'Filter By Category',
    },
    {
      key: 'status',
      label: 'Job Status',
      type: 'select',
      value: status,
      defaultValue: 'all',
      excludeFromCount: true,
      onChange: (val) => setFilter('status', val),
      options: statusOptions,
      isPrimary: true,
      category: 'Filter By Status',
    },
  ];
}

export function buildImportTableColumns(
  copiedJobId: string | null,
  onCopyJobId: (jobId: string) => void
): Column<ImportJob>[] {
  return [
    {
      key: 'category',
      header: 'Category & Entity',
      render: (job) => {
        const cleanKey = (job.category || '').toLowerCase();
        const meta = ALL_IMPORT_CATEGORIES.find((c) => c.key === cleanKey);
        const Icon = meta?.icon || FileSpreadsheet;
        const label = meta?.label || job.category?.replace(/_/g, ' ') || 'Unknown';
        const badgeClass = meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200';

        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 border ${badgeClass}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white capitalize block truncate">
                {label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {cleanKey}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'jobId',
      header: 'Job ID & Started',
      render: (job) => {
        const isCopied = copiedJobId === job.jobId;
        const startedDate = job.startedAt ? new Date(job.startedAt) : null;
        const formattedDate = startedDate
          ? `${startedDate.toLocaleDateString()} ${startedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : '-';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{job.jobId.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={() => onCopyJobId(job.jobId)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Copy full Job UUID"
              >
                {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              {formattedDate}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Progress',
      render: (job) => {
        const isProcessing = job.status === 'processing' || job.status === 'pending';
        const isCompleted = job.status === 'completed';
        const isFailed = job.status === 'failed';
        const hasErrors = Boolean((job.failedCount && job.failedCount > 0) || (job.errors && job.errors.length > 0));

        const percent = job.totalRecords && job.totalRecords > 0
          ? Math.min(100, Math.floor(((job.processedRecords || 0) / job.totalRecords) * 100))
          : job.progressPercent || (isCompleted ? 100 : 0);

        return (
          <div className="space-y-1.5 min-w-[140px]">
            <div className="flex items-center justify-between gap-2">
              {isProcessing ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                  <Loader2 size={12} className="animate-spin text-indigo-500" /> {percent}%
                </span>
              ) : isFailed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20">
                  <AlertCircle size={12} className="text-rose-500" /> Failed
                </span>
              ) : hasErrors ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                  <AlertTriangle size={12} className="text-amber-500" /> Warnings
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Completed
                </span>
              )}

              {isProcessing && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {Number(job.processedRecords || 0).toLocaleString()} / {Number(job.totalRecords || 0).toLocaleString()}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isFailed
                  ? 'bg-rose-500'
                  : hasErrors
                    ? 'bg-amber-500'
                    : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-indigo-600'
                  }`}
                style={{ width: `${Math.min(100, Math.max(isProcessing ? 5 : 0, percent))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'records',
      header: 'Records Breakdown',
      render: (job) => {
        const inserted = Number(job.insertedCount || 0);
        const failed = Number(job.failedCount || 0);
        const total = Number(job.totalRecords || job.processedRecords || 0);

        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {inserted.toLocaleString()} inserted
              </span>
              {failed > 0 && (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  • {failed.toLocaleString()} failed
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              Total: {total.toLocaleString()} records
            </div>
          </div>
        );
      },
    },
    {
      key: 'speed',
      header: 'Speed & Duration',
      render: (job) => {
        const durationSec = ((job.durationMs || 0) / 1000).toFixed(1);
        const speed = job.recordsPerSecond || 0;

        return (
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="font-mono font-medium">
              ⏱️ {durationSec}s
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {speed.toLocaleString()} rec/s
            </div>
          </div>
        );
      },
    },
  ];
}
