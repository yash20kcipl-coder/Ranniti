import api from '@/services/api';
import type { AppDispatch, RootState } from '../store';

export const START_IMPORT_JOB = 'START_IMPORT_JOB';
export const DISMISS_IMPORT_JOB = 'DISMISS_IMPORT_JOB';
export const CLEAR_COMPLETED_JOBS = 'CLEAR_COMPLETED_JOBS';
export const UPDATE_IMPORT_JOB_STATUS = 'UPDATE_IMPORT_JOB_STATUS';
export const SET_ACTIVE_IMPORT_JOBS = 'SET_ACTIVE_IMPORT_JOBS';

export interface ImportJobError {
  error: string;
  index: number;
  row?: Record<string, any>;
}

export interface ImportJob {
  jobId: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  insertedCount: number;
  failedCount: number;
  progressPercent: number;
  recordsPerSecond: number;
  durationMs: number;
  errors: ImportJobError[];
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  startTimeClient: number;
  tenantDbName?: string;
}

const jobCompletionCallbacks = new Map<string, () => void>();

export const executeJobCallback = (jobId: string) => {
  const cb = jobCompletionCallbacks.get(jobId);
  if (cb) {
    try {
      cb();
    } catch (err) {
      console.error('Failed to execute import job completion callback:', err);
    }
    jobCompletionCallbacks.delete(jobId);
  }
};

/**
 * Resolves whether the current session is Super Admin or Tenant,
 * returning the appropriate API endpoint paths for bulk import operations.
 */
const getBulkEndpoints = (getState?: () => RootState) => {
  let isSuperAdmin = false;
  if (getState) {
    const state = getState();
    const currentUser = (state as any).user?.user || (state as any).user?.myprofile;
    const roleStr = String(currentUser?.role || '').toLowerCase();
    isSuperAdmin =
      roleStr === 'super_admin' ||
      roleStr === 'superadmin' ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin'));
  } else if (typeof window !== 'undefined') {
    isSuperAdmin = window.location.pathname.startsWith('/super-admin');
  }

  if (isSuperAdmin) {
    return {
      jobs: '/super-admin/masters/bulk-import/jobs',
      status: (id: string) => `/super-admin/masters/bulk-import/status/${id}`,
      failedRecords: (id: string) => `/super-admin/masters/bulk-import/failed-records/${id}`,
      fileUpload: (cat: string) => `/super-admin/masters/bulk-import-file/${cat}`,
      bulkUpload: (cat: string) => `/super-admin/masters/bulk-import/${cat}`,
      sampleTemplate: (cat: string) => `/super-admin/masters/sample-template/${cat}`,
    };
  }

  return {
    jobs: '/tenant/bulk-import/jobs',
    status: (id: string) => `/tenant/bulk-import/status/${id}`,
    failedRecords: (id: string) => `/tenant/bulk-import/failed-records/${id}`,
    fileUpload: (cat: string) => `/tenant/bulk-import/file/${cat}`,
    bulkUpload: (cat: string) => `/tenant/bulk-import/${cat}`,
    sampleTemplate: (cat: string) => `/tenant/bulk-import/sample-template/${cat}`,
  };
};

export const notifyOtherTabs = (type: string, data?: any) => {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('ranniti_import_jobs_channel');
      channel.postMessage({ type, data });
      channel.close();
    } catch {
      // BroadcastChannel optional fallback
    }
  }
};

export const startBulkImportJob = (
  category: string,
  records: Record<string, any>[],
  onComplete?: () => void,
  context?: Record<string, any>
) => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const endpoints = getBulkEndpoints(getState);
    const cleanContext = context
      ? Object.fromEntries(Object.entries(context).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : undefined;
    const response = await api.post(endpoints.bulkUpload(category), {
      records,
      context: cleanContext,
    });
    const jobData = response.data?.data || response.data?.body?.data || response.data;
    const job: ImportJob = {
      ...jobData,
      category: jobData?.category || category,
      startTimeClient: Date.now(),
    };

    if (onComplete && job.jobId) {
      jobCompletionCallbacks.set(job.jobId, onComplete);
    }

    dispatch({
      type: START_IMPORT_JOB,
      payload: job,
    });
    notifyOtherTabs('JOB_STARTED', job);

    return job;
  };
};

/**
 * Uploads a raw .xlsx file to the backend for streaming import.
 * Supports files of any size (up to 200 MB server-side limit).
 * Context params (stateId, acId, etc.) are appended as query strings.
 */
export const startBulkImportFileJob = (
  category: string,
  file: File,
  onComplete?: () => void,
  context?: Record<string, any>
) => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const endpoints = getBulkEndpoints(getState);
    const formData = new FormData();
    formData.append('file', file);

    // Build query string from non-empty context values
    const params = context
      ? Object.fromEntries(Object.entries(context).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : {};

    const response = await api.post(endpoints.fileUpload(category), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    });

    const jobData = response.data?.data || response.data?.body?.data || response.data;
    const job: ImportJob = {
      ...jobData,
      category: jobData?.category || category,
      startTimeClient: Date.now(),
    };

    if (onComplete && job.jobId) {
      jobCompletionCallbacks.set(job.jobId, onComplete);
    }

    dispatch({
      type: START_IMPORT_JOB,
      payload: job,
    });
    notifyOtherTabs('JOB_STARTED', job);

    return job;
  };
};

export const fetchJobStatus = (jobId: string) => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const endpoints = getBulkEndpoints(getState);
    const response = await api.get(endpoints.status(jobId));
    const rawData = response.data?.data || response.data?.body?.data || response.data;
    const job: ImportJob = rawData;

    dispatch({
      type: UPDATE_IMPORT_JOB_STATUS,
      payload: job,
    });

    return job;
  };
};

export const dismissJob = (jobId: string) => ({
  type: DISMISS_IMPORT_JOB,
  payload: jobId,
});

export const clearCompletedJobs = () => ({
  type: CLEAR_COMPLETED_JOBS,
});

/**
 * Fetches all active and recent background import jobs from the backend.
 * Restores ongoing uploads and recent jobs seamlessly across page reloads.
 */
export const fetchActiveImportJobs = () => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const endpoints = getBulkEndpoints(getState);
      const response = await api.get(endpoints.jobs);
      const rawData = response.data?.data || response.data?.body?.data || response.data || [];
      const jobs: ImportJob[] = Array.isArray(rawData) ? rawData : [];

      dispatch({
        type: SET_ACTIVE_IMPORT_JOBS,
        payload: jobs,
      });

      return jobs;
    } catch (err) {
      console.warn('[ImportJobs] Unable to fetch active jobs from server:', err);
      return [];
    }
  };
};

export const downloadSampleTemplate = (categoryKey: string, params?: Record<string, any>) => {
  return async (_dispatch?: AppDispatch, getState?: () => RootState) => {
    const endpoints = getBulkEndpoints(getState);
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : undefined;
    const res = await api.get(endpoints.sampleTemplate(categoryKey), {
      params: cleanParams,
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${categoryKey}_sample_template.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return res;
  };
};

/**
 * Downloads the server-generated failed records .xlsx spreadsheet for a given job.
 */
export const downloadFailedRecordsSpreadsheet = (job: { jobId: string; category?: string }) => {
  return async (_dispatch?: AppDispatch, getState?: () => RootState) => {
    const endpoints = getBulkEndpoints(getState);
    const res = await api.get(endpoints.failedRecords(job.jobId), {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${(job.category || 'import').toLowerCase()}_failed_records_${job.jobId.slice(0, 8)}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return res;
  };
};
