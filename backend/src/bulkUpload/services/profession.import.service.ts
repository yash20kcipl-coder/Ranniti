import { logger } from '../../utils/logger';
import { query } from '../../queries/dbPool';
import { CacheService } from '../../services/cache.service';
import { MasterCacheInvalidator } from '../../services/cacheInvalidation.service';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';
import { SyncManifestService } from '../../services/syncManifest.service';

export class ProfessionImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    // Auto-create any missing profession categories referenced in the import
    const categoryMap = await LookupResolverService.ensureProfessionCategoriesExist(records);

    // Pre-load existing (category_id, lower_name) pairs to avoid case-insensitive unique index collisions
    const existingRes = await query(
      `SELECT category_id, LOWER(TRIM(name)) AS lower_name FROM professions`
    );
    const existingKeys = new Set<string>(
      existingRes.rows.map((r: any) => `${r.category_id}_${r.lower_name}`)
    );

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: { category_id: string; name: string }[] = [];
        const seenInBatch = new Set<string>();

        for (const row of batch) {
          const rawName = LookupResolverService.extractValue(row, [
            'name',
            'Specific Profession',
            'Specific Profession Name',
            'Profession Name',
            'Profession',
            'professionName',
            'profession',
            'Name',
            'occupation',
            'Occupation',
            'Job',
            'job'
          ]);

          const categoryRef = LookupResolverService.extractValue(row, [
            'categoryName',
            'Category Name',
            'CategoryName',
            'Profession Category',
            'professionCategory',
            'ProfessionCategory',
            'profession_category',
            'Category',
            'category',
            'Details',
            'details',
            'professionType',
            'profession_type',
            'ProfessionType',
            'categoryId',
            'category_id'
          ]).toLowerCase().trim();

          const categoryId =
            categoryMap.get(categoryRef) ||
            context?.categoryId ||
            categoryMap.get('daily wage, household & others') ||
            categoryMap.get('business, retail & trade');

          if (rawName && categoryId) {
            const name = formatTitleCase(rawName);
            const dedupKey = `${categoryId}_${name.toLowerCase().trim()}`;
            if (!seenInBatch.has(dedupKey)) {
              seenInBatch.add(dedupKey);
              rowsToInsert.push({ category_id: categoryId, name });
            }
          }
        }

        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'professions',
          rowsToInsert,
          ['category_id', 'name'],
          {
            conflictTarget: ['category_id', 'name'],
            conflictStrategy: 'DO UPDATE',
            updateColumns: ['name'],
            extraUpdateSql: 'updated_at = NOW()'
          }
        );
        return rowsToInsert.length;
      },
    });

    await MasterCacheInvalidator.invalidate(['professionCategories', 'professions']);

    await SyncManifestService.bumpVersion('profession_categories').catch((err) =>
      logger.error('[ProfessionImportService] Failed to bump profession_categories sync manifest:', err)
    );
    await SyncManifestService.bumpVersion('professions').catch((err) =>
      logger.error('[ProfessionImportService] Failed to bump professions sync manifest:', err)
    );

    // Broadcast categories first so tenant FK constraints on professions.category_id are satisfied
    try {
      const [allCategories, allProfessions] = await Promise.all([
        MasterQueries.getProfessionCategories().catch(() => []),
        MasterQueries.getProfessions().catch(() => []),
      ]);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'profession_categories',
        allCategories.map((c) => ({ id: c.id, name: c.name }))
      );
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'professions',
        allProfessions.map((p) => ({ id: p.id, category_id: p.categoryId, name: p.name }))
      );
    } catch (broadcastErr) {
      logger.error('[ProfessionImportService] Failed to broadcast professions to tenants:', broadcastErr);
    }

    return result;
  }
}
