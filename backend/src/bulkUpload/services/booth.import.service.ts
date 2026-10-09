import { logger } from '../../utils/logger';
import { BulkImporter } from '../../utils/bulkImporter';
import { MasterQueries } from '../../queries/master.queries';
import { LookupResolverService } from '../lookupResolver.service';
import { BatchInsertQuery } from '../../queries/batchInsert.query';
import { BulkImportProgressCallback, BulkImportContext, BulkImportServiceResult } from '../types';

export class BoothImportService {
  static async import(
    records: Record<string, any>[],
    progressCallback?: BulkImportProgressCallback,
    context?: BulkImportContext
  ): Promise<BulkImportServiceResult> {
    // 1. Batch resolve ACs and Wards in single queries before batch insertion
    const acMap = await LookupResolverService.ensureAcsExist(records, undefined, undefined, context?.pcId);
    const wardMap = await LookupResolverService.ensureWardsExist(records, acMap, context?.acId);

    const result = await BulkImporter.processArray(records, {
      batchSize: 2500,
      concurrency: 2,
      onProgress: progressCallback,
      onBatchInsert: async (batch) => {
        const rowsToInsert: any[] = [];
        for (const row of batch) {
          const name = LookupResolverService.extractValue(row, ['Booth Name', 'BoothName', 'name', 'boothName', 'booth_name']);
          const boothNum = Number(LookupResolverService.extractValue(row, ['Booth Number', 'BoothNumber', 'boothNumber', 'booth_number', 'boothNo']) || 1);
          const acRef = LookupResolverService.extractValue(row, ['AC Name', 'ACName', 'acName', 'ac', 'acId', 'ac_id']).toLowerCase();
          const acId = acMap.get(acRef) || context?.acId;

          const wardRef = LookupResolverService.extractValue(row, ['Ward Name', 'WardName', 'wardName', 'ward', 'wardId', 'ward_id']).toLowerCase();
          const wardNum = LookupResolverService.extractValue(row, ['Ward Number', 'WardNumber', 'wardNumber', 'ward_number']);
          const wardId = wardMap.get(wardRef) || (acId && wardNum ? wardMap.get(`${acId}_${wardNum}`) : null) || context?.wardId || null;

          if (name && acId) {
            rowsToInsert.push({
              ac_id: acId,
              ward_id: wardId || null,
              booth_number: boothNum,
              name,
              location_building: LookupResolverService.extractValue(row, ['Location Building', 'LocationBuilding', 'locationBuilding', 'location_building']) || null,
              total_voters: Number(LookupResolverService.extractValue(row, ['Total Voters', 'TotalVoters', 'totalVoters', 'total_voters']) || 0),
            });
          }
        }
        if (rowsToInsert.length === 0) return 0;
        const res = await BatchInsertQuery.executeBatchImport(
          'booths',
          rowsToInsert,
          ['ac_id', 'ward_id', 'booth_number', 'name', 'location_building', 'total_voters'],
          { conflictTarget: ['ac_id', 'booth_number'], conflictStrategy: 'DO NOTHING' }
        );
        return res.insertedCount;
      },
    });

    // Broadcast newly imported booths to scoped tenants per AC
    try {
      const { MasterBroadcastSync } = await import('../../services/sync/masterBroadcastSync.service');
      const touchedAcIds = Array.from(
        new Set(
          records
            .map((r) => {
              const acRef = LookupResolverService.extractValue(r, ['AC Name', 'ACName', 'acName', 'ac', 'acId', 'ac_id']).toLowerCase();
              return acMap.get(acRef) || context?.acId;
            })
            .filter(Boolean)
        )
      ) as string[];

      for (const acId of touchedAcIds) {
        const boothsRes = await MasterQueries.getBooths({ acId });
        const rawList = Array.isArray(boothsRes) ? boothsRes : (boothsRes?.data || []);
        const boothRows = rawList.map((b: any) => ({
          id: b.id,
          ac_id: b.acId || b.ac_id,
          ward_id: b.wardId || b.ward_id || null,
          booth_number: b.boothNumber || b.booth_number,
          name: b.name,
          location_building: b.locationBuilding || b.location_building || null,
          total_voters: b.totalVoters || b.total_voters || 0,
        }));
        if (boothRows.length > 0) {
          await MasterBroadcastSync.broadcastBatchToScopedTenants('booths', boothRows, acId);
        }
      }
    } catch (broadcastErr) {
      logger.error('[BoothImportService] Failed to broadcast booths to scoped tenants:', broadcastErr);
    }

    return result;
  }
}
