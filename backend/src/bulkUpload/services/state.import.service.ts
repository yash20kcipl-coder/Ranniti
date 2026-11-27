import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class StateImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    _context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert = batch
          .map((row) => ({ name: (row['State Name'] || row.StateName || row.name || row.stateName || '').trim() }))
          .filter((r) => r.name.length > 0);
        const uniqueRowsMap = new Map<string, any>();
        for (const r of rowsToInsert) {
          uniqueRowsMap.set(r.name.toLowerCase(), r);
        }
        const deduplicatedRows = Array.from(uniqueRowsMap.values());
        if (deduplicatedRows.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'states',
          deduplicatedRows,
          ['name'],
          { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
        );
        await MasterQueries.getStates(); // Warm cache
        return res.insertedCount;
      },
    });

    await MasterCacheInvalidator.invalidate('states');
    try {
      const allStates = await MasterQueries.getStates().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'states',
        allStates.map((s: any) => ({
          id: s.id,
          name: s.name,
        }))
      );
    } catch (broadcastErr) {
      const { logger } = await import('../../utils/logger');
      logger.error('[StateImportService] Failed to broadcast states to tenants:', broadcastErr);
    }

    return result;
  }
}
