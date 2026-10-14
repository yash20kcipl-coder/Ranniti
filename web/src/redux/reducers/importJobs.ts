import {
  START_IMPORT_JOB,
  UPDATE_IMPORT_JOB_STATUS,
  DISMISS_IMPORT_JOB,
  CLEAR_COMPLETED_JOBS,
  SET_ACTIVE_IMPORT_JOBS,
  type ImportJob,
} from '../actions/importJobs';

export interface ImportJobsState {
  jobs: Record<string, ImportJob>;
  activeJobIds: string[];
}

const initialState: ImportJobsState = {
  jobs: {},
  activeJobIds: [],
};

const getDismissedJobIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('ranniti_dismissed_job_ids') || '[]');
  } catch {
    return [];
  }
};

const saveDismissedJobId = (jobId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getDismissedJobIds();
    if (!list.includes(jobId)) {
      localStorage.setItem('ranniti_dismissed_job_ids', JSON.stringify([...list.slice(-50), jobId]));
    }
  } catch {}
};

const removeDismissedJobId = (jobId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getDismissedJobIds();
    if (list.includes(jobId)) {
      localStorage.setItem('ranniti_dismissed_job_ids', JSON.stringify(list.filter((id) => id !== jobId)));
    }
  } catch {}
};

export default function importJobsReducer(
  state = initialState,
  action: { type: string; payload?: any }
): ImportJobsState {
  switch (action.type) {
    case START_IMPORT_JOB: {
      const job: ImportJob = action.payload;
      removeDismissedJobId(job.jobId);
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [job.jobId]: job,
        },
        activeJobIds: state.activeJobIds.includes(job.jobId)
          ? state.activeJobIds
          : [job.jobId, ...state.activeJobIds],
      };
    }

    case UPDATE_IMPORT_JOB_STATUS: {
      const updatedJob: ImportJob = action.payload;
      const existing = state.jobs[updatedJob.jobId];

      const mergedJob: ImportJob = existing
        ? {
            ...existing,
            ...updatedJob,
            startTimeClient: existing.startTimeClient,
          }
        : {
            ...updatedJob,
            startTimeClient: Date.now(),
          };

      return {
        ...state,
        jobs: {
          ...state.jobs,
          [updatedJob.jobId]: mergedJob,
        },
        activeJobIds: state.activeJobIds.includes(updatedJob.jobId)
          ? state.activeJobIds
          : [updatedJob.jobId, ...state.activeJobIds],
      };
    }

    case SET_ACTIVE_IMPORT_JOBS: {
      const serverJobs: ImportJob[] = action.payload || [];
      const dismissedIds = getDismissedJobIds();

      const newJobsMap = { ...state.jobs };
      const newActiveIds = new Set(state.activeJobIds);

      // Keep recent jobs started within the last 2 hours
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

      for (const job of serverJobs) {
        if (!job || !job.jobId) continue;
        newJobsMap[job.jobId] = {
          ...(newJobsMap[job.jobId] || {}),
          ...job,
          startTimeClient: newJobsMap[job.jobId]?.startTimeClient || Date.now(),
        };

        const isRunning = job.status === 'processing' || job.status === 'pending';
        const isRecent = job.startedAt ? new Date(job.startedAt).getTime() > twoHoursAgo : false;
        const isDismissed = dismissedIds.includes(job.jobId);

        // Always show if currently running; if finished, show if recent and not dismissed
        if (isRunning || (isRecent && !isDismissed)) {
          newActiveIds.add(job.jobId);
        }
      }

      return {
        ...state,
        jobs: newJobsMap,
        activeJobIds: Array.from(newActiveIds),
      };
    }

    case DISMISS_IMPORT_JOB: {
      const jobId = action.payload;
      saveDismissedJobId(jobId);
      const nextJobs = { ...state.jobs };
      delete nextJobs[jobId];
      return {
        ...state,
        jobs: nextJobs,
        activeJobIds: state.activeJobIds.filter((id) => id !== jobId),
      };
    }

    case CLEAR_COMPLETED_JOBS: {
      return {
        ...state,
        activeJobIds: state.activeJobIds.filter((id) => state.jobs[id]?.status === 'processing'),
      };
    }

    default:
      return state;
  }
}
