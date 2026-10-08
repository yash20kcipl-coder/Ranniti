import React from 'react';
import {
  UploadCloud,
  Zap,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import type { ImportJobItem } from '@/redux/actions/superAdminDashboard';

interface LiveImportTrackerCardProps {
  jobs: ImportJobItem[];
  loading: boolean;
  onRefresh: () => void;
}

export const LiveImportTrackerCard: React.FC<LiveImportTrackerCardProps> = ({
  jobs,
  loading,
  onRefresh,
}) => {
  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'pending');
  const recentCompleted = jobs.filter((j) => j.status === 'completed' || j.status === 'failed').slice(0, 3);
  const displayJobs = activeJobs.length > 0 ? activeJobs : recentCompleted;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Data Import Monitor
                </h3>
                {activeJobs.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse">
                    <Zap className="w-3 h-3" />
                    {activeJobs.length} Running
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100k+ Records Background Batch Importer
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh jobs"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>

        {displayJobs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No active bulk import jobs
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Bulk imports of 100,000+ voters or booths will stream here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map((job) => {
              const isProcessing = job.status === 'processing';
              const isCompleted = job.status === 'completed';

              return (
                <div
                  key={job.jobId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {job.category} Import
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isProcessing
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      {isProcessing && job.recordsPerSecond > 0 && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {job.recordsPerSecond.toLocaleString()} rec/s
                        </span>
                      )}
                      <span>{job.progressPercent}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isProcessing
                          ? 'bg-blue-500 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, job.progressPercent))}%` }}
                    />
                  </div>

                  {/* Job Stats line */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Inserted: <strong>{job.insertedCount.toLocaleString()}</strong> /{' '}
                      {job.totalRecords > 0 ? job.totalRecords.toLocaleString() : 'streaming'}
                    </span>
                    {job.failedCount > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        Failed: {job.failedCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Batch Size: <strong>2,500 - 5,000</strong></span>
        <span>Worker Concurrency: <strong>4x</strong></span>
      </div>
    </div>
  );
};
