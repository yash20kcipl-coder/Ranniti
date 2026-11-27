import React from 'react';
import { Download, Eye, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { ImportJob } from '@/redux/actions/importJobs';

export interface ImportRowActionsProps {
  job: ImportJob;
  onInspectErrors: (job: ImportJob) => void;
  onDownloadFailed: (job: ImportJob) => void;
  onDownloadReport: (job: ImportJob) => void;
  onDismiss: (jobId: string) => void;
}

export const ImportRowActions: React.FC<ImportRowActionsProps> = ({
  job,
  onInspectErrors,
  onDownloadFailed,
  onDownloadReport,
  onDismiss,
}) => {
  const hasErrors = Boolean(
    (job.failedCount && job.failedCount > 0) || (job.errors && job.errors.length > 0)
  );

  return (
    <div className="flex items-center justify-end gap-1.5">
      {hasErrors && (
        <>
          <button
            type="button"
            onClick={() => onInspectErrors(job)}
            className="p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
            title="Inspect row-level errors"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDownloadFailed(job)}
            className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
            title="Download Failed Records (.xlsx)"
          >
            <FileSpreadsheet size={15} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onDownloadReport(job)}
        className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="Download Full Report (.xlsx)"
      >
        <Download size={15} />
      </button>
      <button
        type="button"
        onClick={() => onDismiss(job.jobId)}
        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="Remove job from list"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default ImportRowActions;
