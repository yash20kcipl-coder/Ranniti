import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

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

          // Reject empty names, pure numeric strings (like 6-digit postal PIN codes), or invalid entries
          if (name && talukaId && !/^\d{4,8}$/.test(name.trim())) {
            rowsToInsert.push({
              taluka_id: talukaId,
              name: formatTitleCase(name),
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

    await MasterCacheInvalidator.invalidate('villages');
    try {
      const { MasterQueries } = await import('../../queries/master.queries');
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      const affectedDistrictIds = new Set<string>(districtMap.values());
      if (context?.districtId) affectedDistrictIds.add(context.districtId);
      if (context?.talukaId && affectedDistrictIds.size === 0) {
        const parentTaluka = await MasterQueries.getTalukaById(context.talukaId).catch(() => null);
        if (parentTaluka?.districtId) affectedDistrictIds.add(parentTaluka.districtId);
      }

      for (const districtId of affectedDistrictIds) {
        // Ensure parent talukas (including any newly created by ensureTalukasExist) exist in scoped tenants first
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

        const villagesRes = await MasterQueries.getVillages({ districtId }).catch(() => []);
        const districtVillages = Array.isArray(villagesRes) ? villagesRes : villagesRes?.villages || [];
        if (districtVillages.length > 0) {
          await MasterBroadcastSync.broadcastBatchToDistrictTenants(
            'villages',
            districtVillages.map((v: any) => ({
              id: v.id,
              name: v.name,
              taluka_id: v.talukaId || v.taluka_id,
            })),
            districtId
          );
        }
      }
    } catch (broadcastErr) {
      const { logger } = await import('../../utils/logger');
      logger.error('[VillageImportService] Failed to broadcast villages to tenants:', broadcastErr);
    }

    return result;
  }
}
