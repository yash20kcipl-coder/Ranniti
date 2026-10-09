import fs from 'fs';
import ExcelJS from 'exceljs';
import { logger } from '../../utils/logger';
import { Request, Response } from 'express';
import { query } from '../../queries/dbPool';
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
        fs.unlink(uploadedPath, () => { });
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
          let currentRowNumber = 1;

          for await (const worksheetReader of workbookReader) {
            if (sheetFound) break;
            sheetFound = true; // Use the first sheet with data

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

              // Skip entirely empty rows
              const hasData = Object.entries(rowObj).some(([k, v]) => k !== '__rowIndex' && v !== '' && v != null);
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
        'File bulk import job initiated in background.',
        202
      );
      res.status(response.statusCode).json(response.body);
    } catch (err: any) {
      if (uploadedPath) fs.unlink(uploadedPath, () => { });
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

  /**
   * GET /api/v1/masters/bulk-import/failed-records/:jobId
   * Export all failed records with failure reasons as an Excel file (.xlsx)
   */
  static async downloadFailedRecords(req: Request, res: Response): Promise<void> {
    try {
      const jobIdStr = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
      const job = importJobTracker.getJob(jobIdStr);

      if (!job) {
        res.status(404).json(ApiResponse.error(`Import job '${jobIdStr}' not found.`, 404));
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
      logger.error('[MasterBulkController] Error downloading failed records:', err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to download failed records Excel'));
    }
  }

  /**
   * GET /api/v1/masters/bulk-import/demo/records
   * Fetch paginated list of sandbox test records from bulk_upload_demos
   */
  static async getDemoRecords(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;
      const search = (req.query.search as string || '').trim().toLowerCase();
      const batchId = (req.query.batchId as string || '').trim();

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (batchId) {
        params.push(batchId);
        whereClause += ` AND test_batch_id = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        whereClause += ` AND (LOWER(full_name) LIKE $${params.length} OR LOWER(COALESCE(epic_number, '')) LIKE $${params.length} OR LOWER(COALESCE(mobile_number, '')) LIKE $${params.length})`;
      }

      const countSql = `SELECT COUNT(*)::int AS total FROM bulk_upload_demos ${whereClause}`;
      const countRes = await query(countSql, params);
      const total = countRes.rows[0]?.total || 0;

      const dataSql = `
        SELECT id, test_batch_id AS "testBatchId", row_number AS "rowNumber",
               epic_number AS "epicNumber", full_name AS "fullName", relative_name AS "relativeName",
               gender, age, mobile_number AS "mobileNumber", email, booth_number AS "boothNumber",
               section_name AS "sectionName", address, status, raw_metadata AS "rawMetadata",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM bulk_upload_demos
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const dataRes = await query(dataSql, [...params, limit, offset]);

      res.status(200).json(ApiResponse.success({
        records: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }, 'Demo records fetched successfully').body);
    } catch (err: any) {
      logger.error('[MasterBulkController] Error fetching demo records:', err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to fetch demo records').body);
    }
  }

  /**
   * DELETE /api/v1/masters/bulk-import/demo/purge
   * Wipe test data from bulk_upload_demos
   */
  static async purgeDemoRecords(req: Request, res: Response): Promise<void> {
    try {
      const batchId = (req.query.batchId as string || '').trim();
      let deleteSql: string;
      const params: any[] = [];

      if (batchId) {
        deleteSql = 'DELETE FROM bulk_upload_demos WHERE test_batch_id = $1';
        params.push(batchId);
      } else {
        deleteSql = 'TRUNCATE TABLE bulk_upload_demos';
      }

      await query(deleteSql, params);
      logger.info(`[MasterBulkController] Purged demo records ${batchId ? `for batch ${batchId}` : '(all)'}`);

      res.status(200).json(ApiResponse.success({ purged: true }, 'Demo records purged successfully').body);
    } catch (err: any) {
      logger.error('[MasterBulkController] Error purging demo records:', err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to purge demo records').body);
    }
  }

  /**
   * GET /api/v1/masters/bulk-import/demo/benchmark-file
   * Generate downloadable benchmark Excel test file with configurable size
   */
  static async downloadDemoBenchmarkFile(req: Request, res: Response): Promise<void> {
    try {
      const count = Math.min(25000, Math.max(10, parseInt(req.query.count as string) || 1000));
      const includeInvalid = req.query.includeInvalid !== 'false';

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Ranniti Benchmark Generator';
      const sheet = workbook.addWorksheet('Benchmark Data');

      sheet.addRow([
        'Full Name',
        'EPIC No',
        'Relative Name',
        'Gender',
        'Age',
        'Mobile',
        'Email',
        'Booth No',
        'Section Name',
        'Address',
        'Status',
      ]);

      const firstNames = ['Ramesh', 'Suresh', 'Pooja', 'Priya', 'Amit', 'Sunil', 'Kavita', 'Anil', 'Deepak', 'Manish'];
      const lastNames = ['Sharma', 'Patil', 'Deshmukh', 'Verma', 'Kumar', 'Jadhav', 'Yadav', 'Singh', 'Chavan', 'Gupta'];

      for (let i = 1; i <= count; i++) {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[i % lastNames.length];
        const gender = (i % 2 === 0) ? 'Male' : 'Female';
        const age = 18 + (i % 70);
        const mobile = `98${String(10000000 + i).slice(-8)}`;
        const boothNo = `${100 + (i % 15)}`;

        // Deliberate test vectors
        if (includeInvalid && i === 5) {
          // XSS / HTML test row: should be sanitized automatically
          sheet.addRow(['<b>Vikram</b> <script>alert(1)</script>', `TEST_XSS_${i}`, 'Ram Lal', gender, age, mobile, 'xss@test.com', boothNo, 'Chowk', 'House 5', 'active']);
        } else if (includeInvalid && i === 12) {
          // Missing required Full Name: should be captured as failed record
          sheet.addRow(['', `MISSING_NAME_${i}`, 'Shyam Lal', gender, age, mobile, 'missing@test.com', boothNo, 'Chowk', 'House 12', 'active']);
        } else if (includeInvalid && i === 18) {
          // Invalid age (< 18): should be captured as failed record
          sheet.addRow(['Minor Child', `INVALID_AGE_${i}`, 'Parent Name', gender, 12, mobile, 'child@test.com', boothNo, 'Chowk', 'House 18', 'active']);
        } else {
          sheet.addRow([
            `${fn} ${ln}`,
            `EPIC${String(1000000 + i)}`,
            `Father of ${fn}`,
            gender,
            age,
            mobile,
            `${fn.toLowerCase()}.${i}@benchmark.local`,
            boothNo,
            `Section #${(i % 10) + 1}`,
            `Plot ${i}, Ward Road`,
            'active',
          ]);
        }
      }

      // Header styling
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      headerRow.height = 24;

      sheet.columns.forEach((col) => { col.width = 20; });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="benchmark_demo_${count}_rows.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      logger.error('[MasterBulkController] Error generating demo benchmark file:', err);
      res.status(500).json(ApiResponse.error(err.message || 'Failed to generate benchmark file'));
    }
  }
}

