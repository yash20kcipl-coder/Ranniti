import { logger } from '../../utils/logger';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { importJobTracker } from '../../services/importJobTracker';
import { MasterBulkService } from '../../services/superAdmin/masterBulk.service';

export class MasterBulkController {
  /**
   * POST /api/v1/masters/bulk-import/:category
   * Initiates an asynchronous bulk import job
   */
  static async startBulkImport(req: Request, res: Response): Promise<void> {
    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
      const { records, context } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json(ApiResponse.error('Payload must contain an array of records to import.'));
        return;
      }

      // Create background import job
      const job = importJobTracker.createJob(categoryStr, records.length);

      // Launch async worker without awaiting completion (fire and forget)
      setImmediate(() => {
        MasterBulkService.processBulkImportJob(job.jobId, categoryStr, records, context).catch((err) => {
          logger.error(`[MasterBulkController] Async import task error for job ${job.jobId}:`, err);
        });
      });

      // Return immediate 202 Accepted response
      const response = ApiResponse.success(
        {
          jobId: job.jobId,
          category: job.category,
          totalRecords: job.totalRecords,
          status: job.status,
          startedAt: job.startedAt,
        },
        'Bulk import job initiated in background.',
        202
      );
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      logger.error('[MasterBulkController] Error starting bulk import job:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to start bulk import job', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * GET /api/v1/masters/bulk-import/status/:jobId
   * Fetch current job progress
   */
  static async getBulkImportStatus(req: Request, res: Response): Promise<void> {
    try {
      const jobIdStr = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
      const job = importJobTracker.getJob(jobIdStr);

      if (!job) {
        const errResp = ApiResponse.error(`Import job with ID '${jobIdStr}' not found.`, 404);
        res.status(errResp.statusCode).json(errResp.body);
        return;
      }

      const response = ApiResponse.success(job, 'Job status fetched successfully');
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      const errResp = ApiResponse.error(err.message || 'Failed to fetch job status', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * GET /api/v1/masters/bulk-import/jobs
   * Get all active & recent import jobs
   */
  static async getAllImportJobs(req: Request, res: Response): Promise<void> {
    try {
      const jobs = importJobTracker.getAllJobs();
      const response = ApiResponse.success(jobs, 'Import jobs retrieved successfully');
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      const errResp = ApiResponse.error(err.message || 'Failed to fetch import jobs', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * GET /api/v1/masters/sample-template/:category
   * Download sample Excel template file (.xlsx)
   */
  static async downloadSampleTemplate(req: Request, res: Response): Promise<void> {
    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
      const buffer = await MasterBulkService.getSampleExcelTemplate(categoryStr, req.query);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${categoryStr.toLowerCase()}_sample_template.xlsx"`
      );
      res.status(200).send(buffer);
    } catch (err: any) {
      logger.error(`[MasterBulkController] Error generating sample template for ${req.params.category}:`, err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to generate sample template'));
    }
  }
}

