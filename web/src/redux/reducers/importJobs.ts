import {
  START_IMPORT_JOB,
  UPDATE_IMPORT_JOB_STATUS,
  DISMISS_IMPORT_JOB,
  CLEAR_COMPLETED_JOBS,
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

export default function importJobsReducer(
  state = initialState,
  action: { type: string; payload?: any }
): ImportJobsState {
  switch (action.type) {
    case START_IMPORT_JOB: {
      const job: ImportJob = action.payload;
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

    case DISMISS_IMPORT_JOB: {
      const jobId = action.payload;
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
