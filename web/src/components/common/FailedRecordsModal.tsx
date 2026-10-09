import * as XLSX from 'xlsx';
import { Modal } from './Modal';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FormInput } from './FormInput';
import React, { useState, useMemo } from 'react';
import type { ImportJob, ImportJobError } from '@/redux/actions/importJobs';
import { Download, AlertCircle, Search, Clock, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export interface FailedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ImportJob | null;
}

export const FailedRecordsModal: React.FC<FailedRecordsModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [search, setSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const errors = useMemo<ImportJobError[]>(() => {
    return job?.errors || [];
  }, [job]);

  const filteredErrors = useMemo(() => {
    if (!search.trim()) return errors;
    const query = search.toLowerCase().trim();
    return errors.filter((e) => {
      const matchIndex = String(e.index).includes(query);
      const matchError = e.error?.toLowerCase().includes(query);
      const matchRow = e.row ? JSON.stringify(e.row).toLowerCase().includes(query) : false;
      return matchIndex || matchError || matchRow;
    });
  }, [errors, search]);

  const handleDownloadExcel = async () => {
    if (!job) return;
    setIsDownloading(true);
    try {
      // Attempt downloading server-generated rich .xlsx first
      const res = await api.get(`/super-admin/masters/bulk-import/failed-records/${job.jobId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(job.category || 'import').toLowerCase()}_failed_records_${job.jobId.slice(0, 8)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Failed records spreadsheet downloaded');
    } catch {
      // Fallback: client-side XLSX generation
      try {
        const rows = (job.errors || []).map((e) => {
          const rowData: Record<string, any> = {
            'Excel Row #': (e.index ?? 0) + 1,
            'Failure Reason': e.error || 'Failed validation',
            ...(e.row || {}),
          };
          delete rowData['__rowIndex'];
          return rowData;
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Message: 'No failed records available' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
        XLSX.writeFile(wb, `${(job.category || 'import').toLowerCase()}_failed_records_${job.jobId.slice(0, 8)}.xlsx`);
        toast.success('Failed records spreadsheet downloaded');
      } catch (err: any) {
        toast.error('Failed to generate spreadsheet');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!job) return null;

  const durationSec = ((job.durationMs || 0) / 1000).toFixed(1);
  const categoryLabel = (job.category || 'records').replace(/_/g, ' ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Failed & Missed Data — ${categoryLabel.toUpperCase()}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Rows</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {job.totalRecords?.toLocaleString() || job.processedRecords?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Inserted
            </span>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {job.insertedCount?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
            <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Failed / Missed
            </span>
            <p className="text-base font-bold text-rose-700 dark:text-rose-400 mt-0.5">
              {job.failedCount?.toLocaleString() || errors.length || 0}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40">
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time Taken
            </span>
            <p className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
              {durationSec}s{' '}
              <span className="text-xs font-normal text-slate-500">
                ({job.recordsPerSecond || 0} r/s)
              </span>
            </p>
          </div>
        </div>

        {/* Toolbar: Search & Download */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1 max-w-sm">
            <FormInput
              placeholder="Search by row #, error reason, or data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isDownloading || (job.failedCount === 0 && errors.length === 0)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Downloading...' : 'Download Failed Excel (.xlsx)'}</span>
          </button>
        </div>

        {/* Table of Failed Records */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="max-h-96 overflow-y-auto">
            {filteredErrors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium">
                  {errors.length === 0 ? 'No failed or missed records recorded for this import.' : 'No errors match your search filter.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-20">Row #</th>
                    <th className="py-2.5 px-3 font-semibold w-64">Failure Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Row Data Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {filteredErrors.map((err, idx) => {
                    const rowPreview = err.row
                      ? Object.entries(err.row)
                        .filter(([k]) => k !== '__rowIndex')
                        .slice(0, 5)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' • ')
                      : 'No raw payload available';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          #{err.index ?? idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[11px] font-sans font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{err.error || 'Failed validation'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-md" title={err.row ? JSON.stringify(err.row, null, 2) : ''}>
                          {rowPreview}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span>Showing {filteredErrors.length} of {errors.length} failed record logs</span>
          <span>Tip: Correct the entries in Excel and re-upload only the corrected rows.</span>
        </div>
      </div>
    </Modal>
  );
};
