import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

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
              name: formatTitleCase(name),
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

    await MasterCacheInvalidator.invalidate('talukas');
    try {
      const { MasterQueries } = await import('../../queries/master.queries');
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      const affectedDistrictIds = new Set<string>(districtMap.values());
      if (context?.districtId) affectedDistrictIds.add(context.districtId);

      for (const districtId of affectedDistrictIds) {
        const districtTalukas = await MasterQueries.getTalukas({ districtId }).catch(() => []);
        if (districtTalukas.length > 0) {
          await MasterBroadcastSync.broadcastBatchToDistrictTenants(
            'talukas',
            districtTalukas.map((t: any) => ({
              id: t.id,
              name: t.name,
              district_id: t.districtId || t.district_id,
            })),
            districtId
          );
        }
      }
    } catch (broadcastErr) {
      const { logger } = await import('../../utils/logger');
      logger.error('[TalukaImportService] Failed to broadcast talukas to tenants:', broadcastErr);
    }

    return result;
  }
}
