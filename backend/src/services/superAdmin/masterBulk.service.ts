import { BulkUploadManager } from '../../bulkUpload';

/**
 * MasterBulkService
 * Facade maintaining backward compatibility for controllers and services,
 * delegating all imports and template operations to the modular backend/src/bulkUpload system.
 */
export class MasterBulkService {
  /**
   * Process asynchronous bulk import job in background
   */
  static async processBulkImportJob(
    jobId: string,
    category: string,
    records: Record<string, any>[],
    context?: Record<string, any>
  ): Promise<void> {
    return BulkUploadManager.processBulkImportJob(jobId, category, records, context);
  }

  /**
   * Return pre-formatted human-readable sample CSV text
   */
  static async getSampleCsvTemplate(category: string): Promise<string> {
    return BulkUploadManager.getSampleCsvTemplate(category);
  }

  /**
   * Return pre-formatted human-readable sample Excel Buffer
   */
  static async getSampleExcelTemplate(category: string, queryParams: Record<string, any> = {}): Promise<Buffer> {
    return BulkUploadManager.getSampleExcelTemplate(category, queryParams);
  }
}
