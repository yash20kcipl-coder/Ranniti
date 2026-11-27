import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

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
        const seenInBatch = new Set<string>();

        for (const row of batch) {
          const rawName = (row['District Name'] || row.DistrictName || row.name || row.districtName || '').trim();
          const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
          const stateId = stateMap.get(stateRef) || context?.stateId;

          if (rawName && stateId) {
            const name = formatTitleCase(rawName);
            const dedupKey = `${stateId}_${name.toLowerCase()}`;
            if (!seenInBatch.has(dedupKey)) {
              seenInBatch.add(dedupKey);
              rowsToInsert.push({ state_id: stateId, name });
            }
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

    await MasterCacheInvalidator.invalidate('districts');
    try {
      const { MasterQueries } = await import('../../queries/master.queries');
      const allDistricts = await MasterQueries.getDistricts().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'districts',
        allDistricts.map((d: any) => ({
          id: d.id,
          name: d.name,
          state_id: d.stateId || d.state_id,
        }))
      );
    } catch (broadcastErr) {
      const { logger } = await import('../../utils/logger');
      logger.error('[DistrictImportService] Failed to broadcast districts to tenants:', broadcastErr);
    }

    return result;
  }
}
