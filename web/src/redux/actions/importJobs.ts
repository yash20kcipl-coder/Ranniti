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

export const startBulkImportJob = (category: string, records: Record<string, any>[]) => {
  return async (dispatch: AppDispatch) => {
    const response = await api.post(`/masters/bulk-import/${category}`, { records });
    const jobData = response.data?.data || response.data?.body?.data || response.data;
    const job: ImportJob = {
      ...jobData,
      category: jobData?.category || category,
      startTimeClient: Date.now(),
    };

    dispatch({
      type: START_IMPORT_JOB,
      payload: job,
    });

    return job;
  };
};

export const fetchJobStatus = (jobId: string) => {
  return async (dispatch: AppDispatch) => {
    const response = await api.get(`/masters/bulk-import/status/${jobId}`);
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

export const downloadSampleTemplate = (categoryKey: string) => {
  return async () => {
    const res = await api.get(`/masters/sample-template/${categoryKey}`, { responseType: 'blob' });
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
