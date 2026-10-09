import { query } from '../../queries/dbPool';
import { logger } from '../../utils/logger';
import { BulkImporter } from '../../utils/bulkImporter';
import { CacheService } from '../../services/cache.service';
import { MasterQueries } from '../../queries/master.queries';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class CasteImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    _context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {

    const religionMap = await LookupResolverService.ensureReligionsExist(records);
    const casteNameToIdMap = await LookupResolverService.ensureCastesExist(records, religionMap);

    // Separate parent castes (no parentCasteName) from subcastes
    const parentRows = records.filter((r) => !r.parentCasteName && !r.parent_caste_id && !r.parentCasteId);
    const subcasteRows = records.filter((r) => r.parentCasteName || r.parent_caste_id || r.parentCasteId);

    let totalProcessed = 0;
    let totalInserted = 0;
    let totalFailed = 0;

    // PASS 1: Insert parent castes
    const pass1Result = await BulkImporter.processArray(parentRows, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: (p) => {
        if (progressCallback) progressCallback(p);
      },
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = (row.name || row.casteName || '').trim();
          const categoryName = (row.category || 'General').trim();
          const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
          const religionId = religionMap.get(religionRef) || null;

          if (name && categoryName) {
            rowsToInsert.push({ name, category: categoryName, religion_id: religionId, parent_caste_id: null });
          }
        }
        const uniqueRowsMap = new Map<string, any>();
        for (const r of rowsToInsert) {
          uniqueRowsMap.set(r.name.toLowerCase(), r);
        }
        const deduplicatedRows = Array.from(uniqueRowsMap.values());
        if (deduplicatedRows.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'castes',
          deduplicatedRows,
          ['name', 'category', 'religion_id', 'parent_caste_id'],
          { conflictTarget: ['name'], conflictStrategy: 'DO UPDATE', updateColumns: ['religion_id', 'category'] }
        );
        return res.insertedCount;
      },
    });

    totalProcessed += pass1Result.totalProcessed;
    totalInserted += pass1Result.insertedCount;
    totalFailed += pass1Result.failedCount;

    // Refresh caste name→id map from DB directly after pass 1
    const allCastesAfterPass1 = await query(`SELECT id, name FROM castes`);
    for (const c of allCastesAfterPass1.rows) {
      casteNameToIdMap.set(c.name.toLowerCase().trim(), c.id);
    }

    // Auto-create any missing parent castes referenced by subcastes
    for (const row of subcasteRows) {
      const pName = (row.parentCasteName || row.parent_caste_name || '').toString().trim();
      if (pName && !casteNameToIdMap.has(pName.toLowerCase())) {
        const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
        const religionId = religionMap.get(religionRef) || null;
        const categoryName = (row.category || 'General').trim();

        const newParentRes = await query(
          `INSERT INTO castes (name, category, religion_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING id, name`,
          [pName, categoryName, religionId]
        );
        if (newParentRes.rows[0]) {
          casteNameToIdMap.set(pName.toLowerCase(), newParentRes.rows[0].id);
          logger.info(`[CasteImportService] Auto-created missing parent caste during caste import: '${newParentRes.rows[0].name}' (${newParentRes.rows[0].id})`);
        }
      }
    }

    // PASS 2: Insert subcastes with resolved parentCasteId
    if (subcasteRows.length > 0) {
      const pass2Result = await BulkImporter.processArray(subcasteRows, {
        batchSize: 2500,
        concurrency: 2,
        onProgress: (p) => {
          if (progressCallback) {
            progressCallback({
              ...p,
              processed: totalProcessed + p.processed,
              inserted: totalInserted + p.inserted,
              failed: totalFailed + p.failed,
            });
          }
        },
        onBatchInsert: async (batch) => {
          const rowsToInsert: any[] = [];
          for (const row of batch) {
            const name = (row.name || row.casteName || '').trim();
            const categoryName = (row.category || 'General').trim();
            const religionRef = String(row.religionName || row.religion || row.religionId || row.religion_id || '').toLowerCase().trim();
            const religionId = religionMap.get(religionRef) || null;

            // Resolve parent caste: try name lookup first, then direct ID
            const parentCasteName = (row.parentCasteName || row.parent_caste_name || '').toString().toLowerCase().trim();
            const parentCasteId = casteNameToIdMap.get(parentCasteName) || row.parentCasteId || row.parent_caste_id || null;

            if (name && categoryName) {
              rowsToInsert.push({ name, category: categoryName, religion_id: religionId, parent_caste_id: parentCasteId });
            }
          }
          const uniqueRowsMap = new Map<string, any>();
          for (const r of rowsToInsert) {
            uniqueRowsMap.set(r.name.toLowerCase(), r);
          }
          const deduplicatedRows = Array.from(uniqueRowsMap.values());
          if (deduplicatedRows.length === 0) return 0;
          const res = await BatchInsertQuery.executeBatchImport(
            'castes',
            deduplicatedRows,
            ['name', 'category', 'religion_id', 'parent_caste_id'],
            { conflictTarget: ['name'], conflictStrategy: 'DO UPDATE', updateColumns: ['religion_id', 'category', 'parent_caste_id'], extraUpdateSql: 'updated_at = NOW()' }
          );
          return res.insertedCount;
        },
      });

      totalProcessed += pass2Result.totalProcessed;
      totalInserted += pass2Result.insertedCount;
      totalFailed += pass2Result.failedCount;
    }

    await CacheService.invalidatePattern('ranniti:masters:castes*');
    try {
      const allCastes = await MasterQueries.getCastes().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'castes',
        allCastes.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          religion_id: c.religionId || null,
          parent_caste_id: c.parentCasteId || null,
        }))
      );
    } catch (broadcastErr) {
      logger.error('[CasteImportService] Failed to broadcast castes to tenants:', broadcastErr);
    }

    return {
      totalProcessed,
      insertedCount: totalInserted,
      failedCount: totalFailed,
      durationMs: 0,
      recordsPerSecond: 0,
      errors: [],
    };
  }
}
