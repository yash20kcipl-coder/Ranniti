import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class TalukaImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    // 1. Batch resolve States and Districts before inserting
    const stateMap = await LookupResolverService.ensureStatesExist(records);
    const districtMap = await LookupResolverService.ensureDistrictsExist(records, stateMap, undefined, context?.stateId);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = LookupResolverService.extractValue(row, ['Taluka Name', 'TalukaName', 'name', 'talukaName', 'taluka', 'Tehsil', 'tehsil']);
          const districtRef = LookupResolverService.extractValue(row, ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']).toLowerCase();
          const stateRef = LookupResolverService.extractValue(row, ['State Name', 'StateName', 'stateName', 'state', 'stateId', 'state_id']).toLowerCase();

          const districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef) || context?.districtId;

          if (name && districtId) {
            rowsToInsert.push({
              district_id: districtId,
              name,
            });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'talukas',
          rowsToInsert,
          ['district_id', 'name'],
          { conflictTarget: ['district_id', 'name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await CacheService.invalidatePattern('ranniti:masters:talukas*');
    return result;
  }
}
