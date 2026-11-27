import { logger } from '../../utils/logger';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';
import { formatTitleCase } from '../../utils/textUtils';

export class PartyImportService {
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
            const rawName = (row.name || row.partyName || '').trim();
            const rawAbbr = (row.abbreviation || row.code || '').trim();
            const rawAlliance = (row.alliance || '').trim();
            return {
              name: rawName ? formatTitleCase(rawName) : '',
              abbreviation: rawAbbr ? rawAbbr.toUpperCase() : '',
              symbol_logo: row.symbolLogo || row.symbol_logo || null,
              alliance: rawAlliance ? formatTitleCase(rawAlliance) : null,
              color: (row.color || '').trim() || null,
            };
          })
          .filter((r) => r.name.length > 0 && r.abbreviation.length > 0);
        const uniqueRowsMap = new Map<string, any>();
        for (const r of rowsToInsert) {
          uniqueRowsMap.set(r.name.toLowerCase(), r);
        }
        const deduplicatedRows = Array.from(uniqueRowsMap.values());
        if (deduplicatedRows.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'parties',
          deduplicatedRows,
          ['name', 'abbreviation', 'symbol_logo', 'alliance', 'color'],
          { conflictTarget: ['name'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    try {
      const allParties = await MasterQueries.getParties().catch(() => []);
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      await MasterBroadcastSync.broadcastBatchToAllTenants(
        'parties',
        allParties.map((p) => ({
          id: p.id,
          name: p.name,
          abbreviation: p.abbreviation,
          symbol_logo: p.symbolLogo || null,
          alliance: p.alliance || null,
          color: p.color || null,
        }))
      );
    } catch (broadcastErr) {
      logger.error('[PartyImportService] Failed to broadcast parties to tenants:', broadcastErr);
    }

    return result;
  }
}
