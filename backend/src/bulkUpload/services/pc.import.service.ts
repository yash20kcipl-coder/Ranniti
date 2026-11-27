import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

export class PcImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const stateMap = await LookupResolverService.ensureStatesExist(records);
    const pcMap = await LookupResolverService.ensurePcsExist(records, stateMap);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = (row['PC Name'] || row.PCName || row.name || row.pcName || '').trim();
          const pcNum = Number(row['PC Number'] || row.PCNumber || row.pcNumber || row.pc_number || 1);
          const stateRef = String(row['State Name'] || row.StateName || row.stateName || row.state || row.stateId || row.state_id || '').toLowerCase().trim();
          const stateId = stateMap.get(stateRef) || context?.stateId;

          if (name && stateId) {
            rowsToInsert.push({ state_id: stateId, pc_number: pcNum, name: formatTitleCase(name) });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'parliamentary_constituencies',
          rowsToInsert,
          ['state_id', 'pc_number', 'name'],
          {
            conflictTarget: ['state_id', 'pc_number'],
            conflictStrategy: 'DO UPDATE',
            updateColumns: ['name']
          }
        );
        return res.insertedCount;
      },
    });

    await MasterCacheInvalidator.invalidate('pcs');

    try {
      const { MasterQueries } = await import('../../queries/master.queries');
      const allPcs = await MasterQueries.getPcs().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'parliamentary_constituencies',
        allPcs.map((p: any) => ({
          id: p.id,
          pc_number: p.pcNumber ?? p.pc_number,
          name: p.name,
          state_id: p.stateId || p.state_id,
        }))
      );
    } catch (broadcastErr) {
      const { logger } = await import('../../utils/logger');
      logger.error('[PcImportService] Failed to broadcast parliamentary constituencies to tenants:', broadcastErr);
    }

    return result;
  }
}
