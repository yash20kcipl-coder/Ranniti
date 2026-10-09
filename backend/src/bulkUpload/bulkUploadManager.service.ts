import {
  ReligionImportService,
  CasteImportService,
  StateImportService,
  DistrictImportService,
  TalukaImportService,
  VillageImportService,
  PcImportService,
  AcImportService,
  WardImportService,
  BoothImportService,
  PartyImportService,
  VoterImportService,
  DemoImportService,
} from './services';
import { logger } from '../utils/logger';
import { SampleTemplateService } from './templates';
import { importJobTracker } from '../services/importJobTracker';
import { BulkImportContext, BulkImportResult } from './types';

export class BulkUploadManager {
  /**
   * Process asynchronous bulk import job in background dispatching to specialized entity services
   */
  static async processBulkImportJob(
    jobId: string,
    category: string,
    records: Record<string, any>[],
    context?: BulkImportContext
  ): Promise<void> {
    try {
      logger.info(`[BulkUploadManager] Starting background import job ${jobId} for category '${category}' (${records.length} records)`);

      const progressCallback = (p: { processed: number; inserted: number; failed: number }) => {
        importJobTracker.updateProgress(jobId, p.processed, p.inserted, p.failed);
      };

      let result: BulkImportResult;

      switch (category.toLowerCase().trim()) {
        case 'religions':
        case 'religion':
          result = await ReligionImportService.import(records, progressCallback, context);
          break;

        case 'castes':
        case 'caste':
          result = await CasteImportService.import(records, progressCallback, context);
          break;

        case 'states':
        case 'state':
          result = await StateImportService.import(records, progressCallback, context);
          break;

        case 'districts':
        case 'district':
          result = await DistrictImportService.import(records, progressCallback, context);
          break;

        case 'talukas':
        case 'taluka':
          result = await TalukaImportService.import(records, progressCallback, context);
          break;

        case 'villages':
        case 'village':
          result = await VillageImportService.import(records, progressCallback, context);
          break;

        case 'pcs':
        case 'pc':
        case 'parliamentary_constituencies':
        case 'parliamentary_constituency':
          result = await PcImportService.import(records, progressCallback, context);
          break;

        case 'acs':
        case 'ac':
        case 'assembly_constituencies':
        case 'assembly_constituency':
          result = await AcImportService.import(records, progressCallback, context);
          break;

        case 'wards':
        case 'ward':
          result = await WardImportService.import(records, progressCallback, context);
          break;

        case 'booths':
        case 'booth':
        case 'polling_booths':
        case 'polling_booth':
          result = await BoothImportService.import(records, progressCallback, context);
          break;

        case 'parties':
        case 'party':
        case 'political_parties':
        case 'political_party':
          result = await PartyImportService.import(records, progressCallback, context);
          break;

        case 'voters':
        case 'voter':
          result = await VoterImportService.import(records, progressCallback, context);
          break;

        case 'demo':
        case 'demos':
        case 'bulk_test':
        case 'bulk_upload_demos':
          result = await DemoImportService.import(records, progressCallback, context);
          break;

        default:
          throw new Error(`Unsupported master category for bulk import: '${category}'`);
      }

      importJobTracker.completeJob(jobId, result.insertedCount, result.failedCount, result.errors);
      logger.info(`[BulkUploadManager] Completed background import job ${jobId} (Inserted: ${result.insertedCount}, Failed: ${result.failedCount})`);
    } catch (err: any) {
      logger.error(`[BulkUploadManager] Background import job ${jobId} failed:`, err);
      importJobTracker.failJob(jobId, err.message || 'Bulk import processing error');
    }
  }

  /**
   * Return pre-formatted human-readable sample CSV template
   */
  static async getSampleCsvTemplate(category: string): Promise<string> {
    return SampleTemplateService.getSampleCsvTemplate(category);
  }

  /**
   * Return pre-formatted human-readable sample Excel Buffer
   */
  static async getSampleExcelTemplate(category: string, queryParams: Record<string, any> = {}): Promise<Buffer> {
    return SampleTemplateService.getSampleExcelTemplate(category, queryParams);
  }
}
