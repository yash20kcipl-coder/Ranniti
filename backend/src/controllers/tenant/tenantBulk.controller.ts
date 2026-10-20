import fs from 'fs';
import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../../utils/apiResponse';
import { BulkUploadManager } from '../../bulkUpload';
import { importJobTracker } from '../../services/importJobTracker';

export class TenantBulkController {
  /**
   * GET /api/v1/tenant/bulk-import/jobs
   * Get all active & recent import jobs belonging to the authenticated tenant.
   */
  static async getAllImportJobs(req: Request, res: Response): Promise<void> {
    try {
      const tenantDbName = req.tenantDbName;
      const jobs = importJobTracker.getAllJobs(tenantDbName);

      const response = ApiResponse.success(jobs, 'Tenant import jobs retrieved successfully');
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      logger.error('[TenantBulkController] Error fetching import jobs:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to fetch import jobs', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * GET /api/v1/tenant/bulk-import/status/:jobId
   * Fetch current job progress for a specific job belonging to the tenant.
   */
  static async getBulkImportStatus(req: Request, res: Response): Promise<void> {
    try {
      const jobIdStr = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
      const tenantDbName = req.tenantDbName;
      const job = importJobTracker.getJob(jobIdStr, tenantDbName);

      if (!job) {
        const errResp = ApiResponse.error(`Import job with ID '${jobIdStr}' not found for this tenant.`, 404);
        res.status(errResp.statusCode).json(errResp.body);
        return;
      }

      const response = ApiResponse.success(job, 'Job status fetched successfully');
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      logger.error('[TenantBulkController] Error fetching job status:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to fetch job status', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * POST /api/v1/tenant/bulk-import/:category
   * Initiates an asynchronous bulk import job from a JSON array of records.
   */
  static async startBulkImport(req: Request, res: Response): Promise<void> {
    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
      const { records, context = {} } = req.body;
      const tenantDbName = req.tenantDbName;

      if (!tenantDbName) {
        res.status(400).json(ApiResponse.error('Tenant database context is required.'));
        return;
      }

      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json(ApiResponse.error('Payload must contain an array of records to import.'));
        return;
      }

      const mergedContext = {
        ...context,
        tenantDbName,
        uploadedBy: req.user?.userId,
      };

      const job = importJobTracker.createJob(categoryStr, records.length, tenantDbName);

      setImmediate(() => {
        BulkUploadManager.processBulkImportJob(job.jobId, categoryStr, records, mergedContext).catch((err) => {
          logger.error(`[TenantBulkController] Async import task error for job ${job.jobId}:`, err);
        });
      });

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
      logger.error('[TenantBulkController] Error starting bulk import job:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to start bulk import job', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * POST /api/v1/tenant/bulk-import/file/:category
   * Accepts a raw .xlsx file upload for background processing scoped to the tenant database.
   */
  static async startBulkImportFile(req: Request, res: Response): Promise<void> {
    const uploadedPath = (req.file as Express.Multer.File | undefined)?.path;

    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
      const tenantDbName = req.tenantDbName;

      if (!tenantDbName) {
        if (uploadedPath) fs.unlink(uploadedPath, () => { });
        res.status(400).json(ApiResponse.error('Tenant database context is required.'));
        return;
      }

      if (!req.file || !uploadedPath) {
        res.status(400).json(ApiResponse.error('No file uploaded. Send an .xlsx file in the "file" field.'));
        return;
      }

      const ext = req.file.originalname.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        fs.unlink(uploadedPath, () => { });
        res.status(400).json(ApiResponse.error('Only .xlsx / .xls files are supported.'));
        return;
      }

      // Context including query params, body and the required tenant database context
      const context: Record<string, any> = {
        ...((req.query as Record<string, any>) || {}),
        ...((req.body as Record<string, any>) || {}),
        tenantDbName,
        uploadedBy: req.user?.userId,
      };
      delete context['file'];

      // Create the tenant-scoped job
      const job = importJobTracker.createJob(categoryStr, 0, tenantDbName);

      // Fire and forget background worker
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
          let currentRowNumber = 1;

          for await (const worksheetReader of workbookReader) {
            if (sheetFound) break;
            sheetFound = true;

            for await (const row of worksheetReader) {
              currentRowNumber++;
              const values = (row as ExcelJS.Row).values as any[];
              const cells = Array.isArray(values) ? values.slice(1) : [];

              if (firstRow) {
                headers = cells.map((v) => (v != null ? String(v).trim() : ''));
                firstRow = false;
                continue;
              }

              const rowObj: Record<string, any> = { __rowIndex: currentRowNumber };
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

              const hasData = Object.entries(rowObj).some(([k, v]) => k !== '__rowIndex' && v !== '' && v != null);
              if (hasData) records.push(rowObj);
            }
          }

          job.totalRecords = records.length;

          await BulkUploadManager.processBulkImportJob(
            job.jobId,
            categoryStr,
            records,
            context
          );
        } catch (err: any) {
          logger.error(`[TenantBulkController] File import job ${job.jobId} failed:`, err);
          importJobTracker.failJob(job.jobId, (err as Error).message);
        } finally {
          fs.unlink(uploadedPath, () => { });
        }
      });

      const response = ApiResponse.success(
        {
          jobId: job.jobId,
          category: job.category,
          status: job.status,
          startedAt: job.startedAt,
        },
        'Tenant bulk import job initiated in background.',
        202
      );
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      if (uploadedPath) fs.unlink(uploadedPath, () => { });
      logger.error('[TenantBulkController] Error starting tenant file bulk import:', err);
      const errResp = ApiResponse.error(err.message || 'Failed to start file bulk import', 500);
      res.status(errResp.statusCode).json(errResp.body);
    }
  }

  /**
   * GET /api/v1/tenant/bulk-import/failed-records/:jobId
   * Export all failed records with failure reasons as an Excel file (.xlsx) for this tenant's job.
   */
  static async downloadFailedRecords(req: Request, res: Response): Promise<void> {
    try {
      const jobIdStr = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
      const tenantDbName = req.tenantDbName;
      const job = importJobTracker.getJob(jobIdStr, tenantDbName);

      if (!job) {
        res.status(404).json(ApiResponse.error(`Import job '${jobIdStr}' not found for this tenant.`, 404));
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Failed Records');

      const errors = job.errors || [];
      if (errors.length === 0) {
        sheet.addRow(['Job ID', job.jobId]);
        sheet.addRow(['Category', job.category]);
        sheet.addRow(['Status', job.status]);
        sheet.addRow(['Message', 'No failed records were found for this import job.']);
      } else {
        const dataKeys = new Set<string>();
        for (const e of errors) {
          if (e.row && typeof e.row === 'object') {
            for (const k of Object.keys(e.row)) {
              if (k !== '__rowIndex') dataKeys.add(k);
            }
          }
        }

        const columns = [
          { header: 'Row #', key: 'rowNum', width: 10 },
          { header: 'Failure Reason', key: 'errorReason', width: 45 },
          ...Array.from(dataKeys).map((k) => ({
            header: k,
            key: k,
            width: Math.max(15, k.length + 5),
          })),
        ];

        sheet.columns = columns;

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDC2626' },
        };

        for (const e of errors) {
          const rowData: Record<string, any> = {
            rowNum: e.index ?? '-',
            errorReason: e.error || 'Failed validation',
            ...(e.row || {}),
          };
          delete rowData['__rowIndex'];
          sheet.addRow(rowData);
        }
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${job.category.toLowerCase()}_failed_records_${job.jobId.slice(0, 8)}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      logger.error('[TenantBulkController] Error downloading failed records:', err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to download failed records Excel'));
    }
  }

  /**
   * GET /api/v1/tenant/bulk-import/sample-template/:category
   * Download sample Excel template file (.xlsx) customized for the tenant.
   */
  static async downloadSampleTemplate(req: Request, res: Response): Promise<void> {
    try {
      const categoryStr = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
      const buffer = await BulkUploadManager.getSampleExcelTemplate(categoryStr, {
        ...req.query,
        tenantDbName: req.tenantDbName,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${categoryStr.toLowerCase()}_sample_template.xlsx"`
      );

      res.send(buffer);
    } catch (err: any) {
      logger.error(`[TenantBulkController] Error generating sample template for ${req.params.category}:`, err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to download sample template'));
    }
  }
}
