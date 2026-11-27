import { logger } from '../../utils/logger';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

export class ReligionImportService {
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
          .map((row) => {
            const raw = (row.name || row.religionName || '').trim();
            return { name: raw ? formatTitleCase(raw) : '' };
          })
          .filter((r) => r.name.length > 0);

        const uniqueRowsMap = new Map<string, any>();
        for (const r of rowsToInsert) { uniqueRowsMap.set(r.name.toLowerCase(), r) }

        const deduplicatedRows = Array.from(uniqueRowsMap.values());

        if (deduplicatedRows.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'religions', deduplicatedRows, ['name'],
          { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await MasterCacheInvalidator.invalidate('religions');
    try {
      const allReligions = await MasterQueries.getReligions().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'religions',
        allReligions.map((r) => ({ id: r.id, name: r.name }))
      );
    } catch (broadcastErr) {
      logger.error('[ReligionImportService] Failed to broadcast religions to tenants:', broadcastErr);
    }

    return result;
  }
}
