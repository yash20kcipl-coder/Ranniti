import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class DistrictImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const stateMap = await LookupResolverService.ensureStatesExist(records);
    await LookupResolverService.ensureDistrictsExist(records, stateMap);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = (row['District Name'] || row.DistrictName || row.name || row.districtName || '').trim();
          const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
          const stateId = stateMap.get(stateRef) || context?.stateId;

          if (name && stateId) {
            rowsToInsert.push({ state_id: stateId, name });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'districts',
          rowsToInsert,
          ['state_id', 'name'],
          { conflictTarget: ['state_id', 'name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await CacheService.invalidatePattern('ranniti:masters:districts*');
    return result;
  }
}
