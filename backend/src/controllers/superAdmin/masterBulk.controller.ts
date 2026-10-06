import fs from 'fs';
import ExcelJS from 'exceljs';
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
   * POST /api/v1/masters/bulk-import-file/:category
   * Accepts a raw .xlsx file upload (multipart/form-data field: "file").
   * Streams the Excel using ExcelJS — handles files of any size without OOM.
   * Context (stateId, acId, etc.) passed as query params or form fields.
   */
  static async startBulkImportFile(req: Request, res: Response): Promise<void> {
    const uploadedPath = (req.file as Express.Multer.File | undefined)?.path;

    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;

      if (!req.file || !uploadedPath) {
        res.status(400).json(ApiResponse.error('No file uploaded. Send an .xlsx file in the "file" field.'));
        return;
      }

      const ext = req.file.originalname.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        fs.unlink(uploadedPath, () => {});
        res.status(400).json(ApiResponse.error('Only .xlsx / .xls files are supported.'));
        return;
      }

      // Extract optional context (stateId, acId, boothId, etc.) from query or body
      const context: Record<string, any> = {
        ...((req.query as Record<string, any>) || {}),
        ...((req.body as Record<string, any>) || {}),
      };
      // Remove the file field from context if accidentally included
      delete context['file'];

      // Create the job immediately and return 202 so the client can poll progress
      const job = importJobTracker.createJob(categoryStr, 0 /* total unknown until streaming */);

      // Stream and process in background (fire-and-forget)
      setImmediate(async () => {
        try {
          const records: Record<string, any>[] = [];

          const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(uploadedPath, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            styles: 'ignore',
            worksheets: 'emit',
          });

          let headers: string[] = [];
          let firstRow = true;
          let sheetFound = false;

          for await (const worksheetReader of workbookReader) {
            if (sheetFound) break;
            sheetFound = true; // Use the first sheet with data

            for await (const row of worksheetReader) {
              const values = (row as ExcelJS.Row).values as any[];
              const cells = Array.isArray(values) ? values.slice(1) : [];

              if (firstRow) {
                headers = cells.map((v) => (v != null ? String(v).trim() : ''));
                firstRow = false;
                continue;
              }

              const rowObj: Record<string, any> = {};
              for (let i = 0; i < headers.length; i++) {
                const key = headers[i];
                if (!key) continue;
                const val = cells[i];
                if (val && typeof val === 'object' && val.richText) {
                  rowObj[key] = val.richText.map((rt: any) => rt.text).join('');
                } else if (val && typeof val === 'object' && val.text != null) {
                  rowObj[key] = val.text;
                } else {
                  rowObj[key] = val != null ? val : '';
                }
              }

              // Skip entirely empty rows
              const hasData = Object.values(rowObj).some((v) => v !== '' && v != null);
              if (hasData) records.push(rowObj);
            }
          }

          // Update total now that we know it
          job.totalRecords = records.length;

          await MasterBulkService.processBulkImportJob(
            job.jobId,
            categoryStr,
            records,
            context
          );
        } catch (err) {
          logger.error(`[MasterBulkController] File import job ${job.jobId} failed:`, err);
          importJobTracker.failJob(job.jobId, (err as Error).message);
        } finally {
          // Clean up uploaded temp file
          fs.unlink(uploadedPath, () => {});
        }
      });

      const response = ApiResponse.success(
        {
          jobId: job.jobId,
          category: job.category,
          status: job.status,
          startedAt: job.startedAt,
        },
        'File bulk import job initiated in background.',
        202
      );
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      if (uploadedPath) fs.unlink(uploadedPath, () => {});
      logger.error('[MasterBulkController] Error starting file bulk import:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to start file bulk import', 500);
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

