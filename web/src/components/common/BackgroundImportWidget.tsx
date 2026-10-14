import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { masterConfig } from '@/config/masterConfig';
import { FailedRecordsModal } from './FailedRecordsModal';
import type { ImportJob } from '@/redux/actions/importJobs';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { TENANT_MASTER_ENDPOINTS } from '@/hooks/useTenantMasterData';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchTenantMasterCategoryData } from '@/redux/actions/masterTenant';
import { fetchSuperAdminMasterCategoryData } from '@/redux/actions/masterSuperAdmin';
import { fetchTenantVotersData, fetchTenantVoterStats } from '@/redux/actions/voterTenant';
import { fetchSuperAdminVotersData, fetchSuperAdminVoterStats } from '@/redux/actions/voterSuperAdmin';
import { fetchJobStatus, dismissJob, executeJobCallback, downloadFailedRecordsSpreadsheet, fetchActiveImportJobs } from '@/redux/actions/importJobs';
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, X, ChevronDown, ChevronUp, Database, Download, Eye, FileSpreadsheet } from 'lucide-react';

export const BackgroundImportWidget: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isMinimized, setIsMinimized] = useState(false);
  const refreshedJobsRef = useRef<Set<string>>(new Set());
  const autoDismissJobsRef = useRef<Set<string>>(new Set());
  const voterFilters = useAppSelector((state) => state.voter.filters);
  const { jobs, activeJobIds } = useAppSelector((state) => state.importJobs);
  const [selectedFailedJob, setSelectedFailedJob] = useState<ImportJob | null>(null);
  const [visualProgressMap, setVisualProgressMap] = useState<Record<string, number>>({});
  const currentUser = useAppSelector((state: any) => state.user?.user || state.user?.myprofile);

  const activeJobsList = activeJobIds.map((id) => jobs[id]).filter(Boolean);
  const roleStr = String(currentUser?.role || '').toLowerCase();
  const isSuperAdmin =
    roleStr === 'super_admin' ||
    roleStr === 'superadmin' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin'));

  // Helper to refresh table data for the imported category upon job completion
  const refreshCategoryData = useCallback((category?: string) => {
    const cleanCat = (category || '').toLowerCase().trim();
    if (!cleanCat) return;

    if (cleanCat === 'voters') {
      if (isSuperAdmin) {
        dispatch(fetchSuperAdminVotersData(voterFilters || {}, false)).catch(() => { });
        dispatch(fetchSuperAdminVoterStats(voterFilters || {})).catch(() => { });
      } else {
        dispatch(fetchTenantVotersData(voterFilters || {}, false)).catch(() => { });
        dispatch(fetchTenantVoterStats(voterFilters || {})).catch(() => { });
      }
      return;
    }

    const isPaginated = ['villages', 'village', 'booths', 'booth', 'wards', 'ward'].includes(cleanCat);
    const fetchAction = isSuperAdmin ? fetchSuperAdminMasterCategoryData : fetchTenantMasterCategoryData;
    const endpoint = isSuperAdmin
      ? (masterConfig[cleanCat]?.apiEndpoint || `/masters/${cleanCat}`)
      : ((TENANT_MASTER_ENDPOINTS as any)[cleanCat]);

    if (endpoint) {
      const params = isPaginated ? { page: 1, limit: 25 } : undefined;
      dispatch(fetchAction(cleanCat, endpoint, false, params)).catch(() => { });
    }
  }, [dispatch, voterFilters, isSuperAdmin]);

  // Restore active and recent background import jobs on component mount & sync across tabs
  useEffect(() => {
    dispatch(fetchActiveImportJobs());

    const syncInterval = setInterval(() => {
      dispatch(fetchActiveImportJobs());
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [dispatch]);

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
          const currentVisual = prevMap[job.jobId] ?? 0;

          if (job.status === 'completed') {
            if (currentVisual !== 100) {
              nextMap[job.jobId] = 100;
              hasChanges = true;
            }
          } else if (job.status === 'failed') {
            // Keep at current visual
          } else {
            // Calculate actual progress percentage from records processed vs total
            const realPercent = job.totalRecords && job.totalRecords > 0
              ? Math.min(99, Math.floor(((job.processedRecords || 0) / job.totalRecords) * 100))
              : Math.min(99, job.progressPercent || 0);

            // Smoothly animate towards realPercent without exceeding actual progress
            if (currentVisual < realPercent) {
              const step = Math.max(1, Math.ceil((realPercent - currentVisual) / 3));
              const nextVal = Math.min(realPercent, currentVisual + step);
              if (nextVal !== currentVisual) {
                nextMap[job.jobId] = nextVal;
                hasChanges = true;
              }
            } else if (currentVisual > realPercent) {
              nextMap[job.jobId] = realPercent;
              hasChanges = true;
            }
          }
        });

        return hasChanges ? nextMap : prevMap;
      });
    }, 100);

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
        executeJobCallback(job.jobId);
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

  const downloadFailedRecords = async (job: any) => {
    try {
      await dispatch(downloadFailedRecordsSpreadsheet(job));
      toast.success('Failed records spreadsheet downloaded');
    } catch {
      try {
        const rows = (job.errors || []).map((e: any) => {
          const rowData: Record<string, any> = {
            'Excel Row #': (e.index ?? 0) + 1,
            'Failure Reason': e.error || 'Failed validation or insert collision',
            ...(e.row || {}),
          };
          delete rowData['__rowIndex'];
          return rowData;
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Message: 'No failed records available for this job' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
        XLSX.writeFile(wb, `${(job.category || 'import').toLowerCase()}_failed_records_${job.jobId.slice(0, 8)}.xlsx`);
        toast.success('Failed records spreadsheet downloaded');
      } catch (err: any) {
        toast.error('Failed to download failed records');
      }
    }
  };

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
      const errorRows = job.errors.map((e: any) => {
        const rowData: Record<string, any> = {
          'Record Row #': (e.index ?? 0) + 1,
          'Failure Reason': e.error || 'Validation or database error',
        };
        if (e.row && typeof e.row === 'object') {
          for (const [k, v] of Object.entries(e.row)) {
            if (k !== '__rowIndex') {
              rowData[k] = v;
            }
          }
        }
        return rowData;
      });
      const errorSheet = XLSX.utils.json_to_sheet(errorRows);
      XLSX.utils.book_append_sheet(workbook, errorSheet, 'Failed Records');
    }

    const filename = `${(job.category || 'import').toLowerCase()}_import_report_${job.jobId.slice(0, 8)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (activeJobsList.length === 0) return null;

  const hasAnyRunning = activeJobsList.some((j) => j.status === 'processing' || j.status === 'pending');
  const hasAnyErrors = activeJobsList.some(
    (j) => (j.failedCount && j.failedCount > 0) || j.status === 'failed' || (j.errors && j.errors.length > 0)
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] sm:w-[440px] max-w-[calc(100vw-2rem)] transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/15 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/95 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasAnyRunning
                  ? 'bg-indigo-400'
                  : hasAnyErrors
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                  }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasAnyRunning
                  ? 'bg-indigo-500'
                  : hasAnyErrors
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  }`}
              />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Background Bulk Engine
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                {activeJobsList.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                activeJobsList.forEach((j) => dispatch(dismissJob(j.jobId)));
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close all notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimized Quick Info Bar */}
        {isMinimized && (
          <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {hasAnyRunning
                ? 'Processing background batches...'
                : hasAnyErrors
                  ? 'Completed with errors'
                  : 'All import jobs finished'}
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Show details
            </button>
          </div>
        )}

        {/* Content */}
        {!isMinimized && (
          <div className="p-3.5 space-y-3 max-h-96 overflow-y-auto">
            {activeJobsList.map((job) => {
              if (!job || !job.jobId) return null;
              const isFinished = job.status === 'completed';
              const isFailed = job.status === 'failed';
              const realTarget = job.totalRecords && job.totalRecords > 0
                ? Math.min(99, Math.floor(((job.processedRecords || 0) / job.totalRecords) * 100))
                : (job.progressPercent || 0);
              const visualPercent = isFinished ? 100 : Math.min(99, visualProgressMap[job.jobId] ?? realTarget);
              const categoryLabel = (job.category || 'records').replace(/_/g, ' ');
              const hasJobErrors = Boolean((job.failedCount && job.failedCount > 0) || isFailed || (job.errors && job.errors.length > 0));

              return (
                <div
                  key={job.jobId}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5 transition-all"
                >
                  {/* Top Row: Category + Status Badge + Close */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${isFailed
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : hasJobErrors
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : isFinished
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}
                      >
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize truncate">
                          {categoryLabel} Import
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          Job #{job.jobId.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Badge */}
                      {isFinished ? (
                        hasJobErrors ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> Warnings
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Done
                          </span>
                        )
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20">
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-500 shrink-0" />{' '}
                          {job.totalRecords && job.processedRecords && job.processedRecords >= job.totalRecords
                            ? 'Finalizing...'
                            : `${visualPercent}%`}
                        </span>
                      )}

                      {/* Dismiss button */}
                      <button
                        type="button"
                        onClick={() => dispatch(dismissJob(job.jobId))}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isFinished
                        ? hasJobErrors
                          ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : isFailed
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400'
                        }`}
                      style={{ width: `${Math.min(100, Math.max(2, visualPercent))}%` }}
                    />
                  </div>

                  {/* Stats & Meta Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    {isFinished ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {Number(job.insertedCount || 0).toLocaleString()} inserted
                          </span>
                          {Number(job.failedCount || 0) > 0 && (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              • {Number(job.failedCount).toLocaleString()} failed
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          ⏱️ {((job.durationMs || 0) / 1000).toFixed(1)}s ({job.recordsPerSecond || 0} rec/s)
                        </span>
                      </>
                    ) : isFailed ? (
                      <>
                        <span className="text-rose-600 dark:text-rose-400 font-medium truncate max-w-[240px]">
                          {job.errorMessage || 'Import failed'}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          ⏱️ {((job.durationMs || 0) / 1000).toFixed(1)}s
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {Number(job.processedRecords || 0).toLocaleString()} / {job.totalRecords ? Number(job.totalRecords).toLocaleString() : '?'} records
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          ⏱️ {((Date.now() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s ({job.recordsPerSecond || 0} rec/s)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Dedicated Action Buttons Row (When Action Buttons are Visible) */}
                  {(hasJobErrors || isFinished) && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                      {hasJobErrors && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedFailedJob(job)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/90 dark:border-rose-800/60 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
                            title="Inspect Missed and Failed Rows in Viewer"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Failed ({Number(job.failedCount || job.errors?.length || 0).toLocaleString()})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFailedRecords(job)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-800 dark:text-rose-200 hover:text-white bg-rose-100/90 hover:bg-rose-600 dark:bg-rose-900/50 dark:hover:bg-rose-700 border border-rose-300/80 dark:border-rose-700 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
                            title="Download Failed Records Spreadsheet (.XLSX)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                            <span>Failed .xlsx</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => downloadImportReport(job)}
                        className={`${hasJobErrors ? 'px-3' : 'w-full'} flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-[0.98]`}
                        title="Download Summary & Complete Report (.XLSX)"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span>Report</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FailedRecordsModal
        isOpen={!!selectedFailedJob}
        onClose={() => setSelectedFailedJob(null)}
        job={selectedFailedJob}
      />
    </div>
  );
};

