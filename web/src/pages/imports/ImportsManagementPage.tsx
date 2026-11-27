import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  fetchActiveImportJobs,
  dismissJob,
  clearCompletedJobs,
  downloadFailedRecordsSpreadsheet,
  downloadSampleTemplate,
  type ImportJob,
} from '@/redux/actions/importJobs';
import { getDismissedJobIds } from '@/redux/reducers/importJobs';
import {
  ALL_IMPORT_CATEGORIES,
  buildImportTableColumns,
  buildImportFilterFields,
  type CategoryMeta,
} from './components/importFilterConfig';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Lock } from 'lucide-react';
import { ImportModals } from './components/ImportModals';
import { DataTable } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { ImportRowActions } from './components/ImportRowActions';
import { ImportStatsCards, type ImportStats } from './components/ImportStatsCards';

export const ImportsManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const { jobs } = useAppSelector((state) => state.importJobs);
  const currentUser = useAppSelector((state: any) => state.user?.user || state.user?.myprofile);

  // Local filter & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [selectedFailedJob, setSelectedFailedJob] = useState<ImportJob | null>(null);
  const [activeImportCategory, setActiveImportCategory] = useState<string | null>(null);

  // Role & Tab Permission Calculations
  const roleStr = String(currentUser?.role || '').toLowerCase();
  const isSuperAdmin =
    roleStr === 'super_admin' ||
    roleStr === 'superadmin' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin'));

  const allowedWebTabs: string[] = useMemo(() => {
    if (isSuperAdmin) return ['*'];
    const rawTabs =
      (currentUser as any)?.allowedWebTabs ||
      (currentUser as any)?.allowedTabs?.webTabs ||
      [];
    return Array.isArray(rawTabs) ? rawTabs : [];
  }, [currentUser, isSuperAdmin]);

  const allowedMasterSubTabs: string[] = useMemo(() => {
    if (isSuperAdmin) return ['*'];
    const rawSub = (currentUser as any)?.allowedTabs?.masterSubTabs || [];
    return Array.isArray(rawSub) && rawSub.length > 0
      ? rawSub.filter((t: string) => t !== 'elections')
      : ['acs', 'wards', 'booths', 'talukas', 'villages', 'castes', 'profession-categories', 'professions'];
  }, [currentUser, isSuperAdmin]);

  // Tab-level Access Check:
  // Super Admin has all access. Tenant user must have 'imports' in allowedWebTabs (or 'bulk_import')
  const hasImportsAccess = useMemo(() => {
    if (isSuperAdmin) return true;
    return allowedWebTabs.includes('imports') || allowedWebTabs.includes('bulk_import');
  }, [isSuperAdmin, allowedWebTabs]);

  // Authorized Categories Scoping:
  // Only expose categories the tenant has tab-level or subtab-level permissions to import
  const authorizedCategories = useMemo<CategoryMeta[]>(() => {
    if (isSuperAdmin) return ALL_IMPORT_CATEGORIES;

    return ALL_IMPORT_CATEGORIES.filter((cat) => {
      // Elections and political parties cannot be imported by tenants (managed exclusively by Super Admin)
      if (cat.superAdminOnly || cat.key === 'elections' || cat.key === 'parties') {
        return false;
      }
      if (cat.key === 'voters') {
        return allowedWebTabs.includes('voter_directory') || allowedWebTabs.includes('voters');
      }
      if (allowedWebTabs.includes('master_data') || allowedWebTabs.includes('tenant-master')) {
        return allowedMasterSubTabs.includes(cat.key);
      }
      return false;
    });
  }, [isSuperAdmin, allowedWebTabs, allowedMasterSubTabs]);

  // Debounce search query
  useDebouncedEffect(
    () => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    },
    150,
    [searchQuery]
  );

  // Initial load
  useEffect(() => {
    dispatch(fetchActiveImportJobs());
  }, [dispatch]);

  // Cross-tab broadcast channel listener
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('ranniti_import_jobs_channel');

    channel.onmessage = (event) => {
      if (event.data?.type === 'JOB_STARTED' || event.data?.type === 'JOB_UPDATED') {
        dispatch(fetchActiveImportJobs());
      }
    };

    return () => {
      channel.close();
    };
  }, [dispatch]);

  // All jobs array sorted newest first (excluding dismissed jobs)
  const allJobsList = useMemo(() => {
    const dismissed = getDismissedJobIds();
    const list = Object.values(jobs || {}).filter((j) => j && j.jobId && !dismissed.includes(j.jobId));
    return list.sort((a, b) => {
      const timeA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const timeB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [jobs]);

  // KPI Calculations
  const stats: ImportStats = useMemo(() => {
    const totalJobs = allJobsList.length;
    const runningJobs = allJobsList.filter(
      (j) => j.status === 'processing' || j.status === 'pending'
    ).length;
    const completedClean = allJobsList.filter(
      (j) => j.status === 'completed' && (!j.failedCount || j.failedCount === 0)
    ).length;
    const warningsOrFailed = allJobsList.filter(
      (j) => (j.status === 'completed' && j.failedCount && j.failedCount > 0) || j.status === 'failed'
    ).length;
    const totalRecordsInserted = allJobsList.reduce((acc, j) => acc + (j.insertedCount || 0), 0);

    return { totalJobs, runningJobs, completedClean, warningsOrFailed, totalRecordsInserted };
  }, [allJobsList]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return allJobsList.filter((job) => {
      // 1. Search Query filter (matches Job ID or Category)
      if (debouncedSearch) {
        const matchesId = job.jobId?.toLowerCase().includes(debouncedSearch);
        const matchesCat = job.category?.toLowerCase().includes(debouncedSearch);
        if (!matchesId && !matchesCat) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'processing' && job.status !== 'processing' && job.status !== 'pending') {
          return false;
        }
        if (statusFilter === 'completed' && (job.status !== 'completed' || (job.failedCount && job.failedCount > 0))) {
          return false;
        }
        if (statusFilter === 'warnings' && (job.status !== 'completed' || !job.failedCount || job.failedCount === 0)) {
          return false;
        }
        if (statusFilter === 'failed' && job.status !== 'failed') {
          return false;
        }
      }

      // 3. Category filter
      if (categoryFilter !== 'all') {
        if (job.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [allJobsList, debouncedSearch, statusFilter, categoryFilter]);

  // Copy Job ID
  const handleCopyJobId = (jobId: string) => {
    navigator.clipboard.writeText(jobId);
    setCopiedJobId(jobId);
    toast.success('Job ID copied to clipboard');
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  // Download Failed Spreadsheet
  const handleDownloadFailed = async (job: ImportJob) => {
    try {
      await dispatch(downloadFailedRecordsSpreadsheet(job));
      toast.success('Failed records spreadsheet downloaded');
    } catch {
      toast.error('Unable to download failed records');
    }
  };

  // Download Full Report (.xlsx)
  const handleDownloadReport = (job: ImportJob) => {
    try {
      const summaryData = [
        { Metric: 'Import Category', Value: (job.category || 'records').replace(/_/g, ' ').toUpperCase() },
        { Metric: 'Job ID', Value: job.jobId },
        { Metric: 'Status', Value: (job.status || 'unknown').toUpperCase() },
        { Metric: 'Total Records Processed', Value: job.totalRecords || 0 },
        { Metric: 'Successfully Inserted Records', Value: job.insertedCount || 0 },
        { Metric: 'Failed Records', Value: job.failedCount || 0 },
        { Metric: 'Duration (Seconds)', Value: ((job.durationMs || 0) / 1000).toFixed(2) },
        { Metric: 'Processing Speed', Value: `${job.recordsPerSecond || 0} records/sec` },
        { Metric: 'Started At', Value: job.startedAt || '-' },
        { Metric: 'Completed At', Value: job.completedAt || '-' },
      ];

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Import Summary');

      if (job.errors && job.errors.length > 0) {
        const errorRows = job.errors.map((e) => {
          const rowData: Record<string, any> = {
            'Excel Row #': (e.index ?? 0) + 1,
            'Failure Reason': e.error || 'Validation or database collision',
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

      const filename = `${(job.category || 'import').toLowerCase()}_report_${job.jobId.slice(0, 8)}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Import report downloaded (.xlsx)');
    } catch {
      toast.error('Failed to export import report');
    }
  };

  // Download Template Handler
  const handleDownloadSample = async (categoryKey: string) => {
    try {
      await dispatch(downloadSampleTemplate(categoryKey));
      toast.success(`Sample template for ${categoryKey} downloaded`);
    } catch {
      toast.error(`Failed to download template for ${categoryKey}`);
    }
  };

  // Dismiss Job Handler
  const handleDismissJob = (jobId: string) => {
    dispatch(dismissJob(jobId));
    toast.success('Job removed from active list');
  };

  // Clear All Completed Jobs
  const handleClearCompleted = () => {
    dispatch(clearCompletedJobs());
    setIsClearConfirmOpen(false);
    toast.success('Completed jobs cleared from dashboard');
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  // Table Columns
  const columns = useMemo(
    () => buildImportTableColumns(copiedJobId, handleCopyJobId),
    [copiedJobId]
  );

  const filterFields = useMemo(
    () =>
      buildImportFilterFields(
        {
          category: categoryFilter,
          status: statusFilter,
          setFilter: (key, val) => {
            if (key === 'status') setStatusFilter(val);
            if (key === 'category') setCategoryFilter(val);
          },
        },
        authorizedCategories
      ),
    [categoryFilter, statusFilter, authorizedCategories]
  );

  // If Tenant has NO Tab Access to 'imports'
  if (!hasImportsAccess) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Restricted: Import Hub Not Enabled
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            The Bulk Import Hub feature is not enabled for your campaign organization role package.
            Please contact your campaign administrator or Super Admin to grant access to the Data Imports tab.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. STANDARDIZED PAGE HEADER (Matching VotersPage) */}
      <PageHeader
        importLabel="Start New Import"
        title="Import Hub & Job Monitor"
        exportLabel="Download Templates"
        icon={<FileSpreadsheet className="w-6 h-6" />}
        onExportClick={() => setIsTemplateModalOpen(true)}
        onImportClick={() => setIsCategoryPickerOpen(true)}
        subtitle="Manage bulk file uploads, track background processing engine, audit error logs, and download templates"
      />

      {/* 2. STATS KPI CARDS (Matching VoterStatsCards) */}
      <ImportStatsCards
        stats={stats}
        activeStatus={statusFilter}
        onResetQuickFilters={() => setStatusFilter('all')}
        onToggleStatus={(st) => setStatusFilter(statusFilter === st ? 'all' : st)}
      />

      {/* 3. UNIFIED DATA TABLE & EMBEDDED FILTERBAR CARD (Matching VotersPage) */}
      <DataTable
        columns={columns}
        data={filteredJobs}
        loading={false}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            filters={filterFields}
            showDrawerButton={false}
            showResetButton={false}
            onReset={handleResetFilters}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search Job ID, Category name..."
          />
        }
        actions={(row: ImportJob) => (
          <ImportRowActions
            job={row}
            onDismiss={handleDismissJob}
            onInspectErrors={setSelectedFailedJob}
            onDownloadFailed={handleDownloadFailed}
            onDownloadReport={handleDownloadReport}
          />
        )}
      />

      {/* 4. MODALS (Matching VoterModals) */}
      <ImportModals
        selectedFailedJob={selectedFailedJob}
        isClearConfirmOpen={isClearConfirmOpen}
        onDownloadSample={handleDownloadSample}
        onClearCompleted={handleClearCompleted}
        isTemplateModalOpen={isTemplateModalOpen}
        isCategoryPickerOpen={isCategoryPickerOpen}
        authorizedCategories={authorizedCategories}
        activeImportCategory={activeImportCategory}
        setSelectedFailedJob={setSelectedFailedJob}
        setIsClearConfirmOpen={setIsClearConfirmOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        setIsCategoryPickerOpen={setIsCategoryPickerOpen}
        setActiveImportCategory={setActiveImportCategory}
      />
    </div>
  );
};

export default ImportsManagementPage;
