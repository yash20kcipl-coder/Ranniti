import { Pool } from 'pg';
import { query as masterQuery } from '../../queries/dbPool';
import { logger } from '../../utils/logger';

export class MasterAutoSyncService {
  /**
   * Syncs a tenant-created AC, Ward, or Booth to the Master database.
   * If immediate sync fails, queues the entity into tenant_sync_outbox in the Tenant DB.
   */
  static async syncEntityToMaster(
    tenantPool: Pool,
    entityType: 'ac' | 'ward' | 'booth',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>
  ): Promise<boolean> {
    try {
      let sql = '';
      let params: any[] = [];

      if (entityType === 'ac') {
        sql = `
          INSERT INTO assembly_constituencies (id, ac_no, ac_name, district_id, pc_id, total_voters, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            ac_no = EXCLUDED.ac_no,
            ac_name = EXCLUDED.ac_name,
            district_id = EXCLUDED.district_id,
            pc_id = EXCLUDED.pc_id,
            total_voters = EXCLUDED.total_voters,
            updated_at = NOW();
        `;
        params = [
          payload.id,
          payload.acNo,
          payload.acName,
          payload.districtId || null,
          payload.pcId || null,
          payload.totalVoters || 0,
        ];
      } else if (entityType === 'ward') {
        sql = `
          INSERT INTO wards (id, ward_no, ward_name, ac_id, total_voters, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            ward_no = EXCLUDED.ward_no,
            ward_name = EXCLUDED.ward_name,
            ac_id = EXCLUDED.ac_id,
            total_voters = EXCLUDED.total_voters,
            updated_at = NOW();
        `;
        params = [
          payload.id,
          payload.wardNo,
          payload.wardName,
          payload.acId || null,
          payload.totalVoters || 0,
        ];
      } else if (entityType === 'booth') {
        sql = `
          INSERT INTO polling_booths (id, booth_no, booth_name, ac_id, ward_id, total_voters, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            booth_no = EXCLUDED.booth_no,
            booth_name = EXCLUDED.booth_name,
            ac_id = EXCLUDED.ac_id,
            ward_id = EXCLUDED.ward_id,
            total_voters = EXCLUDED.total_voters,
            updated_at = NOW();
        `;
        params = [
          payload.id,
          payload.boothNo,
          payload.boothName,
          payload.acId || null,
          payload.wardId || null,
          payload.totalVoters || 0,
        ];
      }

      await masterQuery(sql, params);
      logger.info(`[MasterAutoSync] Successfully synced ${entityType} (${entityId}) to Master DB`);
      return true;
    } catch (err: any) {
      logger.warn(`[MasterAutoSync] Immediate sync failed for ${entityType} (${entityId}). Enqueuing into tenant_sync_outbox: ${err.message}`);
      await this.enqueueOutbox(tenantPool, entityType, entityId, action, payload, err.message);
      return false;
    }
  }

  /**
   * Helper to insert a failed sync operation into tenant_sync_outbox
   */
  private static async enqueueOutbox(
    tenantPool: Pool,
    entityType: string,
    entityId: string,
    action: string,
    payload: Record<string, any>,
    errorMessage: string
  ): Promise<void> {
    const outboxSql = `
      INSERT INTO tenant_sync_outbox (entity_type, entity_id, action, payload, status, error_message, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW());
    `;
    await tenantPool.query(outboxSql, [
      entityType,
      entityId,
      action,
      JSON.stringify(payload),
      errorMessage,
    ]);
  }
}
