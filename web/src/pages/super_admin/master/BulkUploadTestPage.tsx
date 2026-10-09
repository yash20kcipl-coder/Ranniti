import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FlaskConical,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  Zap,
  AlertTriangle,
  RotateCcw,
  Search,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { PageHeader } from '@/components/common/PageHeader';
import { FormInput } from '@/components/common/FormInput';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FailedRecordsModal } from '@/components/common/FailedRecordsModal';
import {
  fetchSuperAdminDemoRecords,
  purgeSuperAdminDemoRecords,
  downloadSuperAdminDemoBenchmarkFile,
} from '@/redux/actions/masterSuperAdmin';
import {
  startBulkImportFileJob,
  downloadSampleTemplate,
  type ImportJob,
} from '@/redux/actions/importJobs';

export const BulkUploadTestPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const demoRecords = useAppSelector((state) => state.master.demoRecords || []);
  const pagination = useAppSelector(
    (state) => state.master.pagination?.demoRecords || { page: 1, limit: 20, total: 0, totalPages: 1 }
  );
  const isFetching = useAppSelector((state) => !!state.master.fetchingCategories?.demoRecords);
  const activeJobs = useAppSelector((state) => state.importJobs?.jobs || {});

  // Find latest demo job
  const latestDemoJob = useMemo<ImportJob | null>(() => {
    const demoJobs = Object.values(activeJobs).filter(
      (j) => j && (j.category === 'demo' || j.category === 'demos' || j.category === 'bulk_test')
    );
    if (demoJobs.length === 0) return null;
    return demoJobs.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )[0];
  }, [activeJobs]);

  // Generator State
  const [benchmarkRowCount, setBenchmarkRowCount] = useState<number>(1000);
  const [includeTestVectors, setIncludeTestVectors] = useState<boolean>(true);
  const [isGeneratingFile, setIsGeneratingFile] = useState<boolean>(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter & Pagination State
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Modal State
  const [purgeModalOpen, setPurgeModalOpen] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [failedModalOpen, setFailedModalOpen] = useState<boolean>(false);

  // Refresh records helper
  const refreshRecords = (page = currentPage) => {
    const params: { page: number; limit: number; search?: string } = {
      page,
      limit: pageSize,
    };
    if (search.trim()) {
      params.search = search.trim();
    }
    dispatch(fetchSuperAdminDemoRecords(params, false)).catch(() => {});
  };

  // Debounced fetch on search or page change (AGENTS.md Rule #13)
  useDebouncedEffect(() => {
    refreshRecords(currentPage);
  }, 250, [dispatch, search, currentPage]);

  // Handle Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      await dispatch(downloadSampleTemplate('demo'));
      toast.success('Sample demo template downloaded');
    } catch {
      toast.error('Failed to download sample template');
    }
  };

  // Handle Benchmark File Generation
  const handleGenerateBenchmark = async () => {
    setIsGeneratingFile(true);
    try {
      await dispatch(
        downloadSuperAdminDemoBenchmarkFile(benchmarkRowCount, includeTestVectors)
      );
      toast.success(
        `Generated benchmark file with ${benchmarkRowCount.toLocaleString()} rows!`
      );
    } catch {
      toast.error('Failed to generate benchmark file');
    } finally {
      setIsGeneratingFile(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Only .xlsx files are supported');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle Trigger Upload
  const handleStartUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an .xlsx file first');
      return;
    }
    setIsUploading(true);
    try {
      await dispatch(
        startBulkImportFileJob('demo', selectedFile, () => {
          refreshRecords(1);
          toast.success('Bulk upload benchmark completed!');
        })
      );
      toast.success(`Upload job queued! Streaming ${selectedFile.name}...`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start bulk upload job');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Purge
  const handleConfirmPurge = async () => {
    setIsPurging(true);
    try {
      await dispatch(purgeSuperAdminDemoRecords());
      toast.success('Sandbox table purged successfully!');
      setPurgeModalOpen(false);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to purge test records');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header (AGENTS.md Rule #18) */}
      <PageHeader
        title="Bulk Upload Sandbox & Benchmark"
        subtitle="Evaluate high-volume streaming imports, verify sanitization, inspect throughput (rec/s), and examine database writes."
        icon={<FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        badge="Engine Testing Suite"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sample Template (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => setPurgeModalOpen(true)}
              disabled={pagination.total === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Purge Test Records</span>
            </button>
          </div>
        }
      />

      {/* Top Testing Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Benchmark Data Generator */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Generate Benchmark File
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create synthetic datasets with deliberate test vectors.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                .xlsx Output
              </span>
            </div>

            {/* Row Count Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Dataset Size:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[500, 1000, 5000, 10000, 25000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBenchmarkRowCount(count)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      benchmarkRowCount === count
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {count >= 1000 ? `${count / 1000}k` : count}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Vectors Toggle */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-200">
                    <input
                      type="checkbox"
                      checked={includeTestVectors}
                      onChange={(e) => setIncludeTestVectors(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Include Edge-Case Vectors</span>
                  </label>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Injects XSS tags (e.g. <code>&lt;b&gt;Vikram&lt;/b&gt; &lt;script&gt;</code>), missing required names, and minor age (&lt;18) rows to test sanitization & failure logging.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <button
              type="button"
              onClick={handleGenerateBenchmark}
              disabled={isGeneratingFile}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGeneratingFile
                  ? 'Generating Spreadsheet...'
                  : `Download Benchmark (${benchmarkRowCount.toLocaleString()} rows)`}
              </span>
            </button>
          </div>
        </div>

        {/* Card 2: Runner & File Upload */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Run Benchmark Test
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload any .xlsx file to test streaming ingestion into sandbox table.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                Chunk Size: 2,500
              </span>
            </div>

            {/* Drop / Select Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for streaming import
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to select benchmark .xlsx file
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Or drag and drop your generated test file here
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>Streaming parser: ExcelJS backend</span>
              <span>Concurrency: 4 workers</span>
            </div>
          </div>

          <div className="pt-5">
            <button
              type="button"
              onClick={handleStartUpload}
              disabled={!selectedFile || isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>{isUploading ? 'Initiating Job...' : 'Execute Benchmark Upload'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Benchmark Performance Banner (If a demo job was run) */}
      {latestDemoJob && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      latestDemoJob.status === 'completed'
                        ? 'bg-emerald-400'
                        : latestDemoJob.status === 'failed'
                        ? 'bg-rose-400'
                        : 'bg-indigo-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      latestDemoJob.status === 'completed'
                        ? 'bg-emerald-500'
                        : latestDemoJob.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Latest Benchmark Run — Job #{latestDemoJob.jobId.slice(0, 8)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    latestDemoJob.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : latestDemoJob.status === 'failed'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {latestDemoJob.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {latestDemoJob.status === 'completed'
                  ? `Completed in ${((latestDemoJob.durationMs || 0) / 1000).toFixed(2)}s at ${
                      latestDemoJob.recordsPerSecond || 0
                    } rec/s throughput.`
                  : latestDemoJob.status === 'processing'
                  ? `Processing ${latestDemoJob.processedRecords?.toLocaleString()} of ${latestDemoJob.totalRecords?.toLocaleString()} rows...`
                  : latestDemoJob.errorMessage || 'Job failed.'}
              </p>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Inserted</span>
                  <span className="font-bold text-emerald-400">
                    {latestDemoJob.insertedCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Failed</span>
                  <span className="font-bold text-rose-400">
                    {latestDemoJob.failedCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Throughput</span>
                  <span className="font-bold text-indigo-300">
                    {latestDemoJob.recordsPerSecond || 0} r/s
                  </span>
                </div>
              </div>

              {((latestDemoJob.failedCount && latestDemoJob.failedCount > 0) ||
                (latestDemoJob.errors && latestDemoJob.errors.length > 0)) && (
                <button
                  type="button"
                  onClick={() => setFailedModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Inspect Missed Rows ({latestDemoJob.failedCount || latestDemoJob.errors.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Database Table Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Table Header Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sandbox Records in Table</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                  {pagination.total?.toLocaleString() || 0} rows
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live records currently stored in PostgreSQL table <code>bulk_upload_demos</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-64">
              <FormInput
                name="search"
                placeholder="Search name, EPIC, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <button
              type="button"
              onClick={() => refreshRecords(currentPage)}
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RotateCcw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-12">#</th>
                  <th className="py-2.5 px-3 font-semibold">Full Name (Sanitized)</th>
                  <th className="py-2.5 px-3 font-semibold">EPIC No</th>
                  <th className="py-2.5 px-3 font-semibold">Relative</th>
                  <th className="py-2.5 px-3 font-semibold">Gender / Age</th>
                  <th className="py-2.5 px-3 font-semibold">Mobile</th>
                  <th className="py-2.5 px-3 font-semibold">Booth No</th>
                  <th className="py-2.5 px-3 font-semibold">Section</th>
                  <th className="py-2.5 px-3 font-semibold">Batch</th>
                  <th className="py-2.5 px-3 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isFetching && demoRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading demo records...</span>
                      </div>
                    </td>
                  </tr>
                ) : demoRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No demo records in sandbox.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Generate a benchmark file above and execute an upload to see live records.
                      </p>
                    </td>
                  </tr>
                ) : (
                  demoRecords.map((r: any, idx: number) => (
                    <tr
                      key={r.id || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {r.rowNumber || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {r.fullName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {r.epicNumber || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.relativeName || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.gender || '-'} • {r.age || '-'} yrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {r.mobileNumber || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.boothNumber || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.sectionName || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {r.testBatchId ? r.testBatchId.slice(0, 8) : '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Showing {demoRecords.length} of {pagination.total.toLocaleString()} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-semibold">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages || isFetching}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Purge (AGENTS.md Rule #10) */}
      <ConfirmModal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        onConfirm={handleConfirmPurge}
        title="Purge Sandbox Test Records?"
        message="This will completely wipe all test records from the bulk_upload_demos PostgreSQL table. This action is instantaneous and cannot be undone."
        confirmText="Wipe Sandbox Data"
        cancelText="Cancel"
        variant="danger"
        isLoading={isPurging}
      />

      {/* Inspect Failed & Missed Records Modal (AGENTS.md Rule #10) */}
      <FailedRecordsModal
        isOpen={failedModalOpen}
        onClose={() => setFailedModalOpen(false)}
        job={latestDemoJob}
      />
    </div>
  );
};
