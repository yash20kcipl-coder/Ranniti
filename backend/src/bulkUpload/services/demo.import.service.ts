import { BulkImporter } from '../../utils/bulkImporter';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class DemoImportService {
  /**
   * High-throughput demo benchmark import service.
   * Tests bulk inserting thousands of records into `bulk_upload_demos`,
   * measuring real-time speed, error capture, and duplicate conflict handling.
   */
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const testBatchId = context?.testBatchId || `BATCH_${Date.now()}`;
    const duplicateStrategy = context?.duplicateStrategy === 'DO UPDATE' ? 'DO UPDATE' : 'DO NOTHING';

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 4,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        const batchErrors: any[] = [];
        let batchFailed = 0;

        for (let idx = 0; idx < batch.length; idx++) {
          const row = batch[idx];
          const rowIndex = row.__rowIndex ?? (idx + 1);

          const fullName = LookupResolverService.extractValue(row, ['Full Name', 'Name', 'fullName', 'name']);
          if (!fullName) {
            batchFailed++;
            batchErrors.push({
              index: rowIndex,
              row,
              error: 'Missing required field: Full Name is empty',
            });
            continue;
          }

          const rawAge = LookupResolverService.extractValue(row, ['Age', 'age']);
          const ageNum = rawAge ? parseInt(rawAge, 10) : null;
          if (rawAge && (isNaN(ageNum as number) || ageNum! < 18 || ageNum! > 125)) {
            batchFailed++;
            batchErrors.push({
              index: rowIndex,
              row,
              error: `Invalid voter age: '${rawAge}' (must be between 18 and 125)`,
            });
            continue;
          }

          const epicNumber = LookupResolverService.extractValue(row, [
            'EPIC No',
            'EPIC_NO',
            'epicNo',
            'epic_no',
            'IdCardNo',
            'epicNumber',
            'Voter ID',
          ]) || null;

          const relativeName = LookupResolverService.extractValue(row, [
            'Relative Name',
            'relativeName',
            'Father/Husband Name',
          ]) || null;

          const gender = LookupResolverService.extractValue(row, ['Gender', 'gender']) || null;
          const mobileNumber = LookupResolverService.extractValue(row, ['Mobile', 'mobile', 'Phone', 'phone', 'mobileNumber']) || null;
          const email = LookupResolverService.extractValue(row, ['Email', 'email']) || null;
          const boothNumber = LookupResolverService.extractValue(row, ['Booth No', 'Booth Number', 'boothNumber', 'booth_number', 'boothNo']) || null;
          const sectionName = LookupResolverService.extractValue(row, ['Section Name', 'sectionName', 'section_name']) || null;
          const address = LookupResolverService.extractValue(row, ['Address', 'address', 'House No']) || null;
          const status = LookupResolverService.extractValue(row, ['Status', 'status']) || 'active';

          // Pack remaining fields into JSONB metadata
          const rawMetadata: Record<string, any> = {};
          for (const [k, v] of Object.entries(row)) {
            if (!k.startsWith('__') && v !== undefined && v !== null && v !== '') {
              rawMetadata[k] = v;
            }
          }

          rowsToInsert.push({
            test_batch_id: testBatchId,
            row_number: rowIndex,
            epic_number: epicNumber,
            full_name: fullName,
            relative_name: relativeName,
            gender,
            age: ageNum,
            mobile_number: mobileNumber,
            email,
            booth_number: boothNumber,
            section_name: sectionName,
            address,
            status,
            raw_metadata: JSON.stringify(rawMetadata),
          });
        }

        if (rowsToInsert.length === 0) {
          return { inserted: 0, failed: batchFailed, errors: batchErrors };
        }

        const insertRes = await BatchInsertQuery.executeBatchImport(
          'bulk_upload_demos',
          rowsToInsert,
          [
            'test_batch_id',
            'row_number',
            'epic_number',
            'full_name',
            'relative_name',
            'gender',
            'age',
            'mobile_number',
            'email',
            'booth_number',
            'section_name',
            'address',
            'status',
            'raw_metadata',
          ],
          {
            conflictTarget: ['test_batch_id', 'epic_number'],
            conflictStrategy: duplicateStrategy,
            updateColumns: ['full_name', 'relative_name', 'mobile_number', 'address', 'status', 'raw_metadata'],
            extraUpdateSql: 'updated_at = NOW()',
          }
        );

        return {
          inserted: insertRes.insertedCount,
          failed: batchFailed,
          errors: batchErrors,
        };
      },
    });

    return result;
  }
}
