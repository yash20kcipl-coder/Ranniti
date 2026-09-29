import * as XLSX from 'xlsx';
import { masterConfig } from '@/config/masterConfig';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMasterCategoryData } from '@/redux/actions/master';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchJobStatus, dismissJob } from '@/redux/actions/importJobs';
import { fetchVotersData, fetchVoterStats } from '@/redux/actions/voter';
import { Loader2, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, Database, Download } from 'lucide-react';

export const BackgroundImportWidget: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isMinimized, setIsMinimized] = useState(false);
  const refreshedJobsRef = useRef<Set<string>>(new Set());
  const autoDismissJobsRef = useRef<Set<string>>(new Set());
  const voterFilters = useAppSelector((state) => state.voter.filters);
  const { jobs, activeJobIds } = useAppSelector((state) => state.importJobs);
  const [visualProgressMap, setVisualProgressMap] = useState<Record<string, number>>({});

  const activeJobsList = activeJobIds.map((id) => jobs[id]).filter(Boolean);

  // Helper to refresh table data for active category + dependent reference categories
  const refreshCategoryData = useCallback((category?: string) => {
    const cleanCat = (category || '').toLowerCase();
    if (cleanCat === 'voters') {
      dispatch(fetchVotersData(voterFilters || {}, false)).catch(() => { });
      dispatch(fetchVoterStats(voterFilters || {})).catch(() => { });
    } else if (cleanCat) {
      const refKeys = Array.from(new Set([cleanCat, 'states', 'districts', 'pcs', 'acs', 'religions', 'castes']));
      refKeys.forEach((key) => {
        const cfg = masterConfig[key];
        const endpoint = cfg ? cfg.apiEndpoint : `/masters/${key}`;
        dispatch(fetchMasterCategoryData(key, endpoint, false)).catch(() => { });
      });
    }
  }, [dispatch, voterFilters]);

  // Poll backend for job status updates every 1.5s while active
  useEffect(() => {
    if (activeJobsList.length === 0) return;

    const pendingOrProcessing = activeJobsList.filter(
      (job) => job.status === 'processing' || job.status === 'pending'
    );

    if (pendingOrProcessing.length === 0) return;

    const interval = setInterval(() => {
      pendingOrProcessing.forEach((job) => {
        dispatch(fetchJobStatus(job.jobId));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [dispatch, activeJobIds]);

  // Visual progression ticker & instant completion snap
  useEffect(() => {
    if (activeJobsList.length === 0) return;

    const ticker = setInterval(() => {
      setVisualProgressMap((prevMap) => {
        const nextMap = { ...prevMap };
        let hasChanges = false;

        activeJobsList.forEach((job) => {
          const currentVisual = prevMap[job.jobId] || 0;

          if (job.status === 'completed') {
            if (currentVisual !== 100) {
              nextMap[job.jobId] = 100;
              hasChanges = true;
            }
          } else if (job.status === 'failed') {
            // Keep at current visual
          } else {
            const backendPercent = job.progressPercent || 0;
            const nextVal = Math.min(99, Math.max(backendPercent, currentVisual + 3));
            if (nextVal !== currentVisual) {
              nextMap[job.jobId] = nextVal;
              hasChanges = true;
            }
          }
        });

        return hasChanges ? nextMap : prevMap;
      });
    }, 150);

    return () => clearInterval(ticker);
  }, [activeJobsList]);

  // Auto Data Refresh & Auto Dismiss on Job Completion
  useEffect(() => {
    activeJobsList.forEach((job) => {
      if (!job || !job.jobId) return;

      const isCompleted = job.status === 'completed';
      const isFailed = job.status === 'failed';

      // 1. Refresh Data ONCE upon backend completion
      if (isCompleted && !refreshedJobsRef.current.has(job.jobId)) {
        refreshedJobsRef.current.add(job.jobId);
        refreshCategoryData(job.category);
      }

      // 2. Auto-Dismiss Widget Popup ONLY for clean imports without errors
      // If there are errors or issues, do NOT auto-dismiss so user can inspect and download Report
      const hasErrors = Boolean((job.failedCount && job.failedCount > 0) || isFailed || (job.errors && job.errors.length > 0));

      if (isCompleted && !hasErrors && !autoDismissJobsRef.current.has(job.jobId)) {
        autoDismissJobsRef.current.add(job.jobId);
        setTimeout(() => {
          dispatch(dismissJob(job.jobId));
        }, 4000);
      }
    });
  }, [activeJobsList, refreshCategoryData, dispatch]);

  const downloadImportReport = (job: any) => {
    const summaryData = [
      { Metric: 'Import Category', Value: (job.category || 'records').replace(/_/g, ' ').toUpperCase() },
      { Metric: 'Job ID', Value: job.jobId },
      { Metric: 'Status', Value: (job.status || 'unknown').toUpperCase() },
      { Metric: 'Total Records Processed', Value: job.totalRecords || 0 },
      { Metric: 'Successfully Inserted Records', Value: job.insertedCount || 0 },
      { Metric: 'Failed Records', Value: job.failedCount || 0 },
      { Metric: 'Duration (Seconds)', Value: ((job.durationMs || 0) / 1000).toFixed(2) },
      { Metric: 'Started At', Value: job.startedAt || '-' },
      { Metric: 'Completed At', Value: job.completedAt || '-' },
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Import Summary');

    if (job.errors && job.errors.length > 0) {
      const errorRows = job.errors.map((e: any) => ({
        'Record Row #': (e.index ?? 0) + 1,
        'Error Reason': e.error || 'Validation error',
      }));
      const errorSheet = XLSX.utils.json_to_sheet(errorRows);
      XLSX.utils.book_append_sheet(workbook, errorSheet, 'Error Log');
    }

    const filename = `${(job.category || 'import').toLowerCase()}_import_report_${job.jobId.slice(0, 8)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (activeJobsList.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-900/10 dark:shadow-indigo-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Background Bulk Engine ({activeJobsList.length})</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                activeJobsList.forEach((j) => dispatch(dismissJob(j.jobId)));
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close all notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 space-y-3.5 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {activeJobsList.map((job) => {
              if (!job || !job.jobId) return null;
              const isFinished = job.status === 'completed';
              const isFailed = job.status === 'failed';
              const visualPercent = isFinished ? 100 : (visualProgressMap[job.jobId] ?? 0);
              const categoryLabel = (job.category || 'records').replace(/_/g, ' ');
              const hasJobErrors = Boolean((job.failedCount && job.failedCount > 0) || isFailed || (job.errors && job.errors.length > 0));

              return (
                <div key={job.jobId} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        Importing {categoryLabel}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isFinished
                          ? `${job.insertedCount || 0} inserted • ${job.failedCount || 0} failed`
                          : isFailed
                            ? job.errorMessage || 'Import failed'
                            : `${job.processedRecords || 0} / ${job.totalRecords || '?'} records (${job.recordsPerSecond || 0} rec/s)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Show Report button ONLY if there are import errors or issues */}
                      {hasJobErrors && (
                        <button
                          type="button"
                          onClick={() => downloadImportReport(job)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white bg-amber-50 hover:bg-amber-100 dark:bg-amber-600/30 dark:hover:bg-amber-600/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-400/30 transition-colors cursor-pointer"
                          title="Download Import Summary & Error Log (.XLSX)"
                        >
                          <Download className="w-3 h-3" /> Report
                        </button>
                      )}
                      {isFinished ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      ) : isFailed ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                          <Loader2 className="w-3 h-3 animate-spin" /> {visualPercent}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => dispatch(dismissJob(job.jobId))}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isFinished
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : isFailed
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400'
                        }`}
                      style={{ width: `${Math.min(100, Math.max(2, visualPercent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

