import api from '@/services/api';
import type { AppDispatch } from '../store';

export const START_IMPORT_JOB = 'START_IMPORT_JOB';
export const UPDATE_IMPORT_JOB_STATUS = 'UPDATE_IMPORT_JOB_STATUS';
export const DISMISS_IMPORT_JOB = 'DISMISS_IMPORT_JOB';
export const CLEAR_COMPLETED_JOBS = 'CLEAR_COMPLETED_JOBS';

export interface ImportJobError {
  index: number;
  error: string;
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

export const startBulkImportJob = (
  category: string,
  records: Record<string, any>[],
  onComplete?: () => void,
  context?: Record<string, any>
) => {
  return async (dispatch: AppDispatch) => {
    const cleanContext = context
      ? Object.fromEntries(Object.entries(context).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : undefined;
    const response = await api.post(`/super-admin/masters/bulk-import/${category}`, {
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
  return async (dispatch: AppDispatch) => {
    const formData = new FormData();
    formData.append('file', file);

    // Build query string from non-empty context values
    const params = context
      ? Object.fromEntries(Object.entries(context).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : {};

    const response = await api.post(`/super-admin/masters/bulk-import-file/${category}`, formData, {
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

    return job;
  };
};


export const fetchJobStatus = (jobId: string) => {
  return async (dispatch: AppDispatch) => {
    const response = await api.get(`/super-admin/masters/bulk-import/status/${jobId}`);
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

export const downloadSampleTemplate = (categoryKey: string, params?: Record<string, any>) => {
  return async () => {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
      : undefined;
    const res = await api.get(`/super-admin/masters/sample-template/${categoryKey}`, {
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

