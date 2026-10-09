import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export interface ImportJobError {
  index: number;
  row?: Record<string, any>;
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
}

class ImportJobTrackerService {
  private jobs: Map<string, ImportJob> = new Map();

  createJob(category: string, totalRecords = 0): ImportJob {
    const jobId = randomUUID();
    const job: ImportJob = {
      jobId,
      category,
      status: 'processing',
      totalRecords,
      processedRecords: 0,
      insertedCount: 0,
      failedCount: 0,
      progressPercent: 0,
      recordsPerSecond: 0,
      durationMs: 0,
      errors: [],
      startedAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);
    logger.info(`[ImportJobTracker] Job created: ${jobId} (${category}, total: ${totalRecords})`);
    return job;
  }

  updateProgress(
    jobId: string,
    processedRecords: number,
    insertedCount: number,
    failedCount: number,
    errors: ImportJobError[] = []
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.processedRecords = processedRecords;
    job.insertedCount = insertedCount;
    job.failedCount = failedCount;

    if (job.totalRecords > 0) {
      job.progressPercent = Math.min(100, Math.round((processedRecords / job.totalRecords) * 100));
    } else {
      job.progressPercent = 50;
    }

    const elapsedSec = (Date.now() - new Date(job.startedAt).getTime()) / 1000;
    job.durationMs = Math.round(elapsedSec * 1000);
    job.recordsPerSecond = elapsedSec > 0 ? Math.round(processedRecords / elapsedSec) : 0;

    if (errors.length > 0) {
      job.errors = [...job.errors, ...errors].slice(0, 500);
    }
  }

  completeJob(
    jobId: string,
    insertedCount?: number,
    failedCount?: number,
    errors: ImportJobError[] = []
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    if (typeof insertedCount === 'number') job.insertedCount = insertedCount;
    if (typeof failedCount === 'number') job.failedCount = failedCount;
    job.processedRecords = job.insertedCount + job.failedCount;
    if (job.totalRecords === 0) job.totalRecords = job.processedRecords;
    job.progressPercent = 100;
    job.completedAt = new Date().toISOString();
    job.durationMs = Date.now() - new Date(job.startedAt).getTime();
    if (job.durationMs > 0) {
      job.recordsPerSecond = Math.round((job.processedRecords / (job.durationMs / 1000)));
    }
    if (errors.length > 0) {
      job.errors = errors.slice(0, 500);
    }

    logger.info(`[ImportJobTracker] Job completed: ${jobId} (Inserted: ${job.insertedCount}, Failed: ${job.failedCount}, Duration: ${job.durationMs}ms)`);
  }

  failJob(jobId: string, errorMessage: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.errorMessage = errorMessage;
    job.completedAt = new Date().toISOString();
    job.durationMs = Date.now() - new Date(job.startedAt).getTime();

    logger.error(`[ImportJobTracker] Job failed: ${jobId} - ${errorMessage}`);
  }

  getJob(jobId: string): ImportJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ImportJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }
}

export const importJobTracker = new ImportJobTrackerService();
