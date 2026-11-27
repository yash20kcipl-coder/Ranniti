import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';
import { SyncManifestService } from '../../services/syncManifest.service';

export class ProfessionCategoryImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    _context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    const existingRes = await query(`SELECT LOWER(TRIM(name)) AS lower_name FROM profession_categories`);
    const existingNames = new Set<string>(existingRes.rows.map((r: any) => r.lower_name));

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const uniqueRowsMap = new Map<string, { name: string }>();

        for (const row of batch) {
          const raw = String(
            row.name || row['Category Name'] || row['Profession Category'] || row.categoryName || row.category || ''
          ).trim();
          if (!raw) continue;

          const name = formatTitleCase(raw);
          const lowerKey = name.toLowerCase().trim();
          if (!existingNames.has(lowerKey) && !uniqueRowsMap.has(lowerKey)) {
            existingNames.add(lowerKey);
            uniqueRowsMap.set(lowerKey, { name });
          }
        }

        const deduplicatedRows = Array.from(uniqueRowsMap.values());
        if (deduplicatedRows.length === 0) return 0;

        const res = await BatchInsertQuery.executeBatchImport(
          'profession_categories',
          deduplicatedRows,
          ['name'],
          { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    await MasterCacheInvalidator.invalidate(['professionCategories', 'professions']);
    await SyncManifestService.bumpVersion('profession_categories').catch((err) =>
      logger.error('[ProfessionCategoryImportService] Failed to bump sync manifest:', err)
    );

    try {
      const allCategories = await MasterQueries.getProfessionCategories().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'profession_categories',
        allCategories.map((c) => ({ id: c.id, name: c.name }))
      );
    } catch (broadcastErr) {
      logger.error('[ProfessionCategoryImportService] Failed to broadcast profession categories to tenants:', broadcastErr);
    }

    return result;
  }
}
