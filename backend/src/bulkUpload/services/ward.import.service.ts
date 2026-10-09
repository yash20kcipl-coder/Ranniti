import { logger } from '../../utils/logger';
import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { MasterQueries } from '../../queries/master.queries';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class WardImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const acMap = await LookupResolverService.ensureAcsExist(records, undefined, undefined, context?.pcId);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = LookupResolverService.extractValue(row, ['Ward Name', 'WardName', 'name', 'wardName', 'ward']);
          const wardNum = Number(LookupResolverService.extractValue(row, ['Ward Number', 'WardNumber', 'wardNumber', 'ward_number']) || 1);
          const acRef = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'acName', 'ac', 'acId', 'ac_id']).toLowerCase();
          const pcRef = LookupResolverService.extractValue(row, ['PC Name', 'PCName', 'pcName', 'pc']).toLowerCase();

          const acId = acMap.get(`${pcRef}_${acRef}`) || acMap.get(acRef) || context?.acId;

          if (name && acId) {
            rowsToInsert.push({
              ac_id: acId,
              ward_number: wardNum,
              name,
            });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'wards',
          rowsToInsert,
          ['ac_id', 'ward_number', 'name'],
          { conflictTarget: ['ac_id', 'ward_number'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await CacheService.invalidatePattern('ranniti:masters:wards*');

    // Broadcast newly imported wards to scoped tenants per AC
    try {
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      const touchedAcIds = Array.from(
        new Set(
          records
            .map((r) => {
              const acRef = String(r['AC Name'] || r.ACName || r.acName || r.ac || r.acId || r.ac_id || '').toLowerCase().trim();
              return acMap.get(acRef) || context?.acId;
            })
            .filter(Boolean)
        )
      ) as string[];

      for (const acId of touchedAcIds) {
        const wardsRes = await MasterQueries.getWards(acId);
        const rawList = Array.isArray(wardsRes) ? wardsRes : ((wardsRes as any)?.data || []);
        const wardRows = rawList.map((w: any) => ({
          id: w.id,
          ac_id: w.acId || w.ac_id,
          ward_number: w.wardNumber || w.ward_number,
          name: w.name,
        }));
        if (wardRows.length > 0) {
          await MasterBroadcastSync.broadcastBatchToScopedTenants('wards', wardRows, acId);
        }
      }
    } catch (broadcastErr) {
      logger.error('[WardImportService] Failed to broadcast wards to scoped tenants:', broadcastErr);
    }

    return result;
  }
}
