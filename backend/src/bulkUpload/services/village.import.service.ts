import { CacheService } from '../../services/cache.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class VillageImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    // 1. Batch resolve States, Districts, and Talukas before insertion
    const stateMap = await LookupResolverService.ensureStatesExist(records);
    const districtMap = await LookupResolverService.ensureDistrictsExist(records, stateMap, undefined, context?.stateId);
    const talukaMap = await LookupResolverService.ensureTalukasExist(records, districtMap, context?.districtId);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = LookupResolverService.extractValue(row, ['Village Name', 'VillageName', 'name', 'villageName', 'village']);
          const rawTaluka = LookupResolverService.extractValue(row, ['Taluka Name', 'TalukaName', 'talukaName', 'taluka', 'talukaId', 'taluka_id']).toLowerCase();
          const rawDistrict = LookupResolverService.extractValue(row, ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']).toLowerCase();

          const talukaId = talukaMap.get(`${rawDistrict}_${rawTaluka}`) || talukaMap.get(rawTaluka) || context?.talukaId;

          if (name && talukaId) {
            rowsToInsert.push({
              taluka_id: talukaId,
              name,
            });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'villages',
          rowsToInsert,
          ['taluka_id', 'name'],
          { conflictTarget: ['taluka_id', 'name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await CacheService.invalidatePattern('ranniti:masters:villages*');
    return result;
  }
}
