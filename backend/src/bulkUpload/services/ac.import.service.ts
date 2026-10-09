import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class AcImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const stateMap = await LookupResolverService.ensureStatesExist(records);
    const districtMap = await LookupResolverService.ensureDistrictsExist(records, stateMap);
    const pcMap = await LookupResolverService.ensurePcsExist(records, stateMap);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'name', 'acName', 'ac_name']);
          const acNum = Number(LookupResolverService.extractValue(row, ['AC Number', 'ACNumber', 'acNumber', 'ac_number']) || 1);
          const pcRef = LookupResolverService.extractValue(row, ['PC Name', 'PCName', 'pcName', 'pc', 'pcId', 'pc_id']).toLowerCase();
          const stateRef = LookupResolverService.extractValue(row, ['State Name', 'StateName', 'stateName', 'state', 'stateId', 'state_id']).toLowerCase();

          const pcId = pcMap.get(`${stateRef}_${pcRef}`) || pcMap.get(pcRef) || context?.pcId;

          const districtRef = LookupResolverService.extractValue(row, ['District Name', 'DistrictName', 'districtName', 'district', 'districtId', 'district_id']).toLowerCase();
          const districtId = districtMap.get(`${stateRef}_${districtRef}`) || districtMap.get(districtRef) || context?.districtId || null;

          if (name && pcId) {
            rowsToInsert.push({
              pc_id: pcId,
              ac_number: acNum,
              name,
              district_id: districtId,
            });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'assembly_constituencies',
          rowsToInsert,
          ['pc_id', 'ac_number', 'name', 'district_id'],
          {
            conflictTarget: ['pc_id', 'ac_number'],
            conflictStrategy: 'DO UPDATE',
            updateColumns: ['name', 'district_id']
          }
        );
        return res.insertedCount;
      },
    });

    await CacheService.invalidatePattern('ranniti:masters:acs*');
    return result;
  }
}
